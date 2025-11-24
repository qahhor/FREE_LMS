import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Redirect,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SsoService } from '../services/sso.service';
import { Response } from 'express';

@Controller('sso')
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  /**
   * SAML Login - Redirect to IdP
   */
  @Get(':organizationId/saml/login')
  async samlLogin(@Param('organizationId') organizationId: number, @Res() res: Response) {
    const loginUrl = await this.ssoService.getSamlLoginUrl(organizationId);
    return res.redirect(loginUrl);
  }

  /**
   * SAML Callback - Process SAML response
   */
  @Post(':organizationId/saml/callback')
  @HttpCode(HttpStatus.OK)
  async samlCallback(
    @Param('organizationId') organizationId: number,
    @Body('SAMLResponse') samlResponse: string,
    @Res() res: Response,
  ) {
    const { user, token } = await this.ssoService.processSamlResponse(organizationId, samlResponse);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    return res.redirect(`${frontendUrl}/auth/sso-callback?token=${token}`);
  }

  /**
   * SAML Metadata - For IdP configuration
   */
  @Get(':organizationId/saml/metadata')
  async samlMetadata(@Param('organizationId') organizationId: number, @Res() res: Response) {
    const metadata = await this.ssoService.getSamlMetadata(organizationId);
    res.set('Content-Type', 'text/xml');
    return res.send(metadata);
  }

  /**
   * SAML Logout
   */
  @Get(':organizationId/saml/logout')
  async samlLogout(
    @Param('organizationId') organizationId: number,
    @Query('nameId') nameId: string,
    @Res() res: Response,
  ) {
    const logoutUrl = await this.ssoService.getSamlLogoutUrl(organizationId, nameId);
    return res.redirect(logoutUrl);
  }

  /**
   * OAuth2/OIDC Login - Redirect to authorization server
   */
  @Get(':organizationId/oauth/login')
  async oauthLogin(@Param('organizationId') organizationId: number, @Res() res: Response) {
    const { url, state, nonce } = await this.ssoService.getOAuthAuthorizationUrl(organizationId);

    // Store state and nonce in session/cookie for verification
    res.cookie('oauth_state', state, { httpOnly: true, maxAge: 600000 }); // 10 min
    res.cookie('oauth_nonce', nonce, { httpOnly: true, maxAge: 600000 });

    return res.redirect(url);
  }

  /**
   * OAuth2/OIDC Callback
   */
  @Get(':organizationId/oauth/callback')
  async oauthCallback(
    @Param('organizationId') organizationId: number,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    // Verify state from cookie
    const storedState = res.req.cookies?.oauth_state;
    const storedNonce = res.req.cookies?.oauth_nonce;

    if (state !== storedState) {
      return res.status(400).send('Invalid state parameter');
    }

    const { user, token } = await this.ssoService.processOAuthCallback(
      organizationId,
      code,
      state,
      storedNonce,
    );

    // Clear cookies
    res.clearCookie('oauth_state');
    res.clearCookie('oauth_nonce');

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    return res.redirect(`${frontendUrl}/auth/sso-callback?token=${token}`);
  }

  /**
   * LDAP Login
   */
  @Post(':organizationId/ldap/login')
  @HttpCode(HttpStatus.OK)
  async ldapLogin(
    @Param('organizationId') organizationId: number,
    @Body() body: { username: string; password: string },
  ) {
    const { user, token } = await this.ssoService.authenticateLdap(
      organizationId,
      body.username,
      body.password,
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Get SSO configuration for organization (public endpoint for login page)
   */
  @Get(':organizationId/config')
  async getSsoConfig(@Param('organizationId') organizationId: number) {
    // This would query the organization and return public SSO info
    // Implementation depends on your requirements
    return {
      ssoEnabled: true,
      providers: ['saml', 'oauth2', 'ldap'],
    };
  }
}
