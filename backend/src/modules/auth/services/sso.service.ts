import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as saml2 from 'saml2-js';
import { Issuer, Client, generators } from 'openid-client';
import * as ldap from 'ldapjs';

interface SamlResponse {
  user: {
    nameID: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface OAuthTokens {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
}

@Injectable()
export class SsoService {
  private samlProviders: Map<number, saml2.ServiceProvider> = new Map();
  private oidcClients: Map<number, Client> = new Map();

  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * Initialize SAML Service Provider for organization
   */
  async initializeSamlProvider(organizationId: number): Promise<saml2.ServiceProvider> {
    // Check if already initialized
    if (this.samlProviders.has(organizationId)) {
      return this.samlProviders.get(organizationId);
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization || !organization.ssoEnabled || organization.ssoProvider !== 'saml') {
      throw new BadRequestException('SAML not configured for this organization');
    }

    const config = organization.ssoConfig;

    const sp = new saml2.ServiceProvider({
      entity_id: `${process.env.API_URL}/sso/${organizationId}/saml/metadata`,
      private_key: process.env.SAML_PRIVATE_KEY,
      certificate: process.env.SAML_CERTIFICATE,
      assert_endpoint: `${process.env.API_URL}/sso/${organizationId}/saml/callback`,
      allow_unencrypted_assertion: process.env.NODE_ENV === 'development',
    });

    this.samlProviders.set(organizationId, sp);
    return sp;
  }

  /**
   * Get SAML login URL
   */
  async getSamlLoginUrl(organizationId: number): Promise<string> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization || !organization.ssoEnabled || organization.ssoProvider !== 'saml') {
      throw new BadRequestException('SAML not configured');
    }

    const config = organization.ssoConfig;

    const sp = await this.initializeSamlProvider(organizationId);

    const idp = new saml2.IdentityProvider({
      sso_login_url: config.ssoUrl,
      sso_logout_url: config.sloUrl,
      certificates: [config.certificate],
    });

    return new Promise((resolve, reject) => {
      sp.create_login_request_url(idp, {}, (err, loginUrl) => {
        if (err) reject(err);
        else resolve(loginUrl);
      });
    });
  }

  /**
   * Process SAML response
   */
  async processSamlResponse(organizationId: number, samlResponse: string): Promise<{ user: User; token: string }> {
    const sp = await this.initializeSamlProvider(organizationId);

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    const config = organization.ssoConfig;

    const idp = new saml2.IdentityProvider({
      sso_login_url: config.ssoUrl,
      sso_logout_url: config.sloUrl,
      certificates: [config.certificate],
    });

    // Verify SAML response
    const response: SamlResponse = await new Promise((resolve, reject) => {
      sp.post_assert(idp, { SAMLResponse: samlResponse }, (err, samlResponse) => {
        if (err) reject(err);
        else resolve(samlResponse as any);
      });
    });

    // Find or create user
    const user = await this.findOrCreateUser(
      response.user.email,
      response.user.firstName,
      response.user.lastName,
      organizationId,
    );

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      organizationId,
    });

    return { user, token };
  }

  /**
   * Initialize OAuth2/OIDC client
   */
  async initializeOidcClient(organizationId: number): Promise<Client> {
    // Check if already initialized
    if (this.oidcClients.has(organizationId)) {
      return this.oidcClients.get(organizationId);
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization || !organization.ssoEnabled) {
      throw new BadRequestException('OAuth2/OIDC not configured');
    }

    if (!['oauth2', 'oidc'].includes(organization.ssoProvider)) {
      throw new BadRequestException('Invalid SSO provider');
    }

    const config = organization.ssoConfig;

    // Discover OIDC configuration
    const issuer = await Issuer.discover(config.authorizationUrl);

    const client = new issuer.Client({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uris: [`${process.env.API_URL}/sso/${organizationId}/oauth/callback`],
      response_types: ['code'],
    });

    this.oidcClients.set(organizationId, client);
    return client;
  }

  /**
   * Get OAuth2/OIDC authorization URL
   */
  async getOAuthAuthorizationUrl(organizationId: number): Promise<{ url: string; state: string; nonce: string }> {
    const client = await this.initializeOidcClient(organizationId);

    const state = generators.state();
    const nonce = generators.nonce();

    const url = client.authorizationUrl({
      scope: 'openid email profile',
      state,
      nonce,
    });

    return { url, state, nonce };
  }

  /**
   * Process OAuth2/OIDC callback
   */
  async processOAuthCallback(
    organizationId: number,
    code: string,
    state: string,
    nonce: string,
  ): Promise<{ user: User; token: string }> {
    const client = await this.initializeOidcClient(organizationId);

    const params = client.callbackParams({ code, state });

    const tokenSet = await client.callback(`${process.env.API_URL}/sso/${organizationId}/oauth/callback`, params, {
      state,
      nonce,
    });

    const claims = tokenSet.claims();

    // Find or create user
    const user = await this.findOrCreateUser(
      claims.email,
      claims.given_name || claims.name?.split(' ')[0],
      claims.family_name || claims.name?.split(' ')[1],
      organizationId,
    );

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      organizationId,
    });

    return { user, token };
  }

  /**
   * Authenticate with LDAP
   */
  async authenticateLdap(
    organizationId: number,
    username: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization || !organization.ssoEnabled || organization.ssoProvider !== 'ldap') {
      throw new BadRequestException('LDAP not configured');
    }

    const config = organization.ssoConfig;

    // Create LDAP client
    const client = ldap.createClient({
      url: config.ldapUrl,
      timeout: 5000,
      connectTimeout: 10000,
    });

    // Bind with service account
    await new Promise<void>((resolve, reject) => {
      client.bind(config.ldapBindDn, config.ldapBindPassword, (err) => {
        if (err) reject(new UnauthorizedException('LDAP bind failed'));
        else resolve();
      });
    });

    // Search for user
    const searchFilter = config.ldapSearchFilter.replace('{username}', username);

    const searchResult: any = await new Promise((resolve, reject) => {
      client.search(
        config.ldapBaseDn,
        {
          filter: searchFilter,
          scope: 'sub',
          attributes: ['mail', 'givenName', 'sn', 'cn'],
        },
        (err, res) => {
          if (err) {
            reject(new UnauthorizedException('LDAP search failed'));
            return;
          }

          const entries: any[] = [];

          res.on('searchEntry', (entry) => {
            entries.push(entry.object);
          });

          res.on('error', (err) => {
            reject(new UnauthorizedException('LDAP search error'));
          });

          res.on('end', () => {
            if (entries.length === 0) {
              reject(new UnauthorizedException('User not found'));
            } else {
              resolve(entries[0]);
            }
          });
        },
      );
    });

    // Verify password by trying to bind as user
    const userDn = searchResult.dn;

    await new Promise<void>((resolve, reject) => {
      const userClient = ldap.createClient({
        url: config.ldapUrl,
      });

      userClient.bind(userDn, password, (err) => {
        userClient.unbind();
        if (err) reject(new UnauthorizedException('Invalid credentials'));
        else resolve();
      });
    });

    client.unbind();

    // Find or create user
    const user = await this.findOrCreateUser(
      searchResult.mail,
      searchResult.givenName,
      searchResult.sn,
      organizationId,
    );

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      organizationId,
    });

    return { user, token };
  }

  /**
   * Find or create user from SSO
   */
  private async findOrCreateUser(
    email: string,
    firstName: string,
    lastName: string,
    organizationId: number,
  ): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Create new user
      user = this.userRepository.create({
        email,
        firstName: firstName || 'User',
        lastName: lastName || '',
        role: 'student',
        isActive: true,
        emailVerified: true, // SSO users are pre-verified
        // No password - SSO only
      });

      await this.userRepository.save(user);
    }

    return user;
  }

  /**
   * Get SAML metadata
   */
  async getSamlMetadata(organizationId: number): Promise<string> {
    const sp = await this.initializeSamlProvider(organizationId);
    return sp.create_metadata();
  }

  /**
   * Logout from SAML
   */
  async getSamlLogoutUrl(organizationId: number, nameId: string): Promise<string> {
    const sp = await this.initializeSamlProvider(organizationId);

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    const config = organization.ssoConfig;

    const idp = new saml2.IdentityProvider({
      sso_login_url: config.ssoUrl,
      sso_logout_url: config.sloUrl,
      certificates: [config.certificate],
    });

    return new Promise((resolve, reject) => {
      sp.create_logout_request_url(idp, { name_id: nameId }, (err, logoutUrl) => {
        if (err) reject(err);
        else resolve(logoutUrl);
      });
    });
  }
}
