import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { OrganizationMember } from '../entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { SubscriptionService } from '../../payments/services/subscription.service';
import * as crypto from 'crypto';

interface CreateOrganizationDto {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  ownerId: number;
}

interface UpdateOrganizationDto {
  name?: string;
  description?: string;
  logo?: string;
  domain?: string;
  branding?: any;
  settings?: any;
}

interface InviteMemberDto {
  email: string;
  role: 'admin' | 'manager' | 'instructor' | 'member';
  permissions?: string[];
}

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private subscriptionService: SubscriptionService,
  ) {}

  /**
   * Create organization
   */
  async createOrganization(dto: CreateOrganizationDto): Promise<Organization> {
    // Check if slug is already taken
    const existing = await this.organizationRepository.findOne({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new BadRequestException('Organization slug already exists');
    }

    // Check user's subscription
    const subscription = await this.subscriptionService.getUserSubscription(dto.ownerId);

    if (!subscription.isUsable()) {
      throw new BadRequestException('Active subscription required to create organization');
    }

    // Create organization
    const organization = this.organizationRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      logo: dto.logo,
      ownerId: dto.ownerId,
      isActive: true,
      isVerified: false,
      maxSeats: subscription.plan.maxStudents || 10, // Default to plan's student limit
      usedSeats: 1, // Owner takes 1 seat
      maxCourses: subscription.plan.maxCourses,
      usedCourses: 0,
      whiteLabelEnabled: subscription.plan.whiteLabel,
      customDomainEnabled: subscription.plan.customDomain,
      apiAccessEnabled: subscription.plan.apiAccess,
      scormEnabled: subscription.plan.scormSupport,
      liveSessionsEnabled: subscription.plan.liveSessions > 0,
      ssoEnabled: subscription.plan.ssoEnabled,
    });

    await this.organizationRepository.save(organization);

    // Add owner as member
    const ownerMember = this.memberRepository.create({
      organizationId: organization.id,
      userId: dto.ownerId,
      role: 'owner',
      isActive: true,
      joinedAt: new Date(),
      permissions: ['all'], // Owner has all permissions
    });

    await this.memberRepository.save(ownerMember);

    return organization;
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(id: number): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: ['owner', 'subscriptionPlan'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  /**
   * Get organization by slug
   */
  async getOrganizationBySlug(slug: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { slug },
      relations: ['owner', 'subscriptionPlan'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  /**
   * Get organization by domain
   */
  async getOrganizationByDomain(domain: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { domain },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  /**
   * Get user's organizations
   */
  async getUserOrganizations(userId: number): Promise<Organization[]> {
    const memberships = await this.memberRepository.find({
      where: { userId, isActive: true },
    });

    const organizationIds = memberships.map((m) => m.organizationId);

    return this.organizationRepository.findByIds(organizationIds);
  }

  /**
   * Update organization
   */
  async updateOrganization(
    organizationId: number,
    userId: number,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    // Check permissions
    await this.checkPermission(organizationId, userId, ['organization.update']);

    const organization = await this.getOrganizationById(organizationId);

    // Update fields
    if (dto.name) organization.name = dto.name;
    if (dto.description !== undefined) organization.description = dto.description;
    if (dto.logo !== undefined) organization.logo = dto.logo;

    // Check if custom domain is allowed
    if (dto.domain !== undefined) {
      if (!organization.customDomainEnabled) {
        throw new BadRequestException('Custom domain not enabled for this organization');
      }
      organization.domain = dto.domain;
    }

    if (dto.branding !== undefined) {
      if (!organization.whiteLabelEnabled) {
        throw new BadRequestException('White-label not enabled for this organization');
      }
      organization.branding = { ...organization.branding, ...dto.branding };
    }

    if (dto.settings !== undefined) {
      organization.settings = { ...organization.settings, ...dto.settings };
    }

    return this.organizationRepository.save(organization);
  }

  /**
   * Delete organization
   */
  async deleteOrganization(organizationId: number, userId: number): Promise<void> {
    const organization = await this.getOrganizationById(organizationId);

    // Only owner can delete
    if (organization.ownerId !== userId) {
      throw new ForbiddenException('Only organization owner can delete organization');
    }

    organization.isActive = false;
    await this.organizationRepository.save(organization);
  }

  /**
   * Invite member
   */
  async inviteMember(
    organizationId: number,
    inviterId: number,
    dto: InviteMemberDto,
  ): Promise<OrganizationMember> {
    // Check permissions
    await this.checkPermission(organizationId, inviterId, ['members.invite']);

    const organization = await this.getOrganizationById(organizationId);

    // Check seat limit
    if (organization.maxSeats && organization.usedSeats >= organization.maxSeats) {
      throw new BadRequestException('Organization has reached maximum seat limit');
    }

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found with this email');
    }

    // Check if already a member
    const existing = await this.memberRepository.findOne({
      where: { organizationId, userId: user.id },
    });

    if (existing) {
      if (existing.isActive) {
        throw new BadRequestException('User is already a member');
      } else {
        // Reactivate
        existing.isActive = true;
        existing.role = dto.role;
        existing.permissions = dto.permissions;
        existing.invitedBy = inviterId;
        return this.memberRepository.save(existing);
      }
    }

    // Create membership
    const member = this.memberRepository.create({
      organizationId,
      userId: user.id,
      role: dto.role,
      permissions: dto.permissions || this.getDefaultPermissions(dto.role),
      isActive: true,
      joinedAt: new Date(),
      invitedBy: inviterId,
    });

    await this.memberRepository.save(member);

    // Increment used seats
    organization.usedSeats += 1;
    await this.organizationRepository.save(organization);

    return member;
  }

  /**
   * Remove member
   */
  async removeMember(
    organizationId: number,
    userId: number,
    memberId: number,
  ): Promise<void> {
    // Check permissions
    await this.checkPermission(organizationId, userId, ['members.remove']);

    const member = await this.memberRepository.findOne({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Can't remove owner
    if (member.role === 'owner') {
      throw new BadRequestException('Cannot remove organization owner');
    }

    member.isActive = false;
    await this.memberRepository.save(member);

    // Decrement used seats
    const organization = await this.getOrganizationById(organizationId);
    organization.usedSeats = Math.max(0, organization.usedSeats - 1);
    await this.organizationRepository.save(organization);
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    organizationId: number,
    userId: number,
    memberId: number,
    role: string,
    permissions?: string[],
  ): Promise<OrganizationMember> {
    // Check permissions
    await this.checkPermission(organizationId, userId, ['members.update']);

    const member = await this.memberRepository.findOne({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Can't change owner role
    if (member.role === 'owner') {
      throw new BadRequestException('Cannot change owner role');
    }

    member.role = role as any;
    if (permissions) {
      member.permissions = permissions;
    } else {
      member.permissions = this.getDefaultPermissions(role);
    }

    return this.memberRepository.save(member);
  }

  /**
   * Get organization members
   */
  async getOrganizationMembers(organizationId: number): Promise<OrganizationMember[]> {
    return this.memberRepository.find({
      where: { organizationId, isActive: true },
      relations: ['user'],
      order: { joinedAt: 'DESC' },
    });
  }

  /**
   * Configure SSO
   */
  async configureSso(
    organizationId: number,
    userId: number,
    provider: string,
    config: any,
  ): Promise<Organization> {
    // Check permissions
    await this.checkPermission(organizationId, userId, ['sso.configure']);

    const organization = await this.getOrganizationById(organizationId);

    if (!organization.ssoEnabled) {
      throw new BadRequestException('SSO not enabled for this organization');
    }

    organization.ssoProvider = provider;
    organization.ssoConfig = config;

    return this.organizationRepository.save(organization);
  }

  /**
   * Generate API keys
   */
  async generateApiKeys(organizationId: number, userId: number): Promise<{ apiKey: string; apiSecret: string }> {
    // Check permissions
    await this.checkPermission(organizationId, userId, ['api.manage']);

    const organization = await this.getOrganizationById(organizationId);

    if (!organization.apiAccessEnabled) {
      throw new BadRequestException('API access not enabled for this organization');
    }

    const apiKey = this.generateRandomKey('ak');
    const apiSecret = this.generateRandomKey('as');

    organization.apiKey = apiKey;
    organization.apiSecret = this.hashSecret(apiSecret);

    await this.organizationRepository.save(organization);

    return { apiKey, apiSecret }; // Return plain secret only once
  }

  /**
   * Verify API key
   */
  async verifyApiKey(apiKey: string, apiSecret: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { apiKey },
    });

    if (!organization) {
      throw new NotFoundException('Invalid API key');
    }

    if (!organization.apiAccessEnabled || !organization.isActive) {
      throw new ForbiddenException('API access disabled');
    }

    // Verify secret
    const hashedSecret = this.hashSecret(apiSecret);
    if (organization.apiSecret !== hashedSecret) {
      throw new ForbiddenException('Invalid API secret');
    }

    return organization;
  }

  /**
   * Check if user has permission
   */
  async checkPermission(organizationId: number, userId: number, requiredPermissions: string[]): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { organizationId, userId, isActive: true },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this organization');
    }

    // Owner has all permissions
    if (member.role === 'owner') {
      return;
    }

    // Check if user has required permissions
    const hasPermission = requiredPermissions.some(
      (perm) => member.permissions.includes(perm) || member.permissions.includes('all'),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  /**
   * Get member by user ID
   */
  async getMemberByUserId(organizationId: number, userId: number): Promise<OrganizationMember> {
    const member = await this.memberRepository.findOne({
      where: { organizationId, userId, isActive: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  /**
   * Get default permissions for role
   */
  private getDefaultPermissions(role: string): string[] {
    switch (role) {
      case 'owner':
        return ['all'];
      case 'admin':
        return [
          'organization.update',
          'members.invite',
          'members.remove',
          'members.update',
          'courses.create',
          'courses.update',
          'courses.delete',
          'api.manage',
        ];
      case 'manager':
        return ['courses.create', 'courses.update', 'members.invite'];
      case 'instructor':
        return ['courses.create', 'courses.update'];
      case 'member':
        return ['courses.view'];
      default:
        return [];
    }
  }

  /**
   * Generate random key
   */
  private generateRandomKey(prefix: string): string {
    const random = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${random}`;
  }

  /**
   * Hash secret
   */
  private hashSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }
}
