import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OrganizationService } from '../services/organization.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  /**
   * Create organization
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrganization(
    @CurrentUser() user: User,
    @Body()
    body: {
      name: string;
      slug: string;
      description?: string;
      logo?: string;
    },
  ) {
    const organization = await this.organizationService.createOrganization({
      name: body.name,
      slug: body.slug,
      description: body.description,
      logo: body.logo,
      ownerId: user.id,
    });

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      description: organization.description,
      logo: organization.logo,
      isActive: organization.isActive,
      isVerified: organization.isVerified,
      createdAt: organization.createdAt,
    };
  }

  /**
   * Get organization by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrganizationById(@Param('id') id: number) {
    const organization = await this.organizationService.getOrganizationById(id);

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      description: organization.description,
      logo: organization.logo,
      domain: organization.domain,
      owner: {
        id: organization.owner.id,
        firstName: organization.owner.firstName,
        lastName: organization.owner.lastName,
        email: organization.owner.email,
      },
      seats: {
        used: organization.usedSeats,
        max: organization.maxSeats,
      },
      courses: {
        used: organization.usedCourses,
        max: organization.maxCourses,
      },
      features: {
        whiteLabel: organization.whiteLabelEnabled,
        customDomain: organization.customDomainEnabled,
        apiAccess: organization.apiAccessEnabled,
        scorm: organization.scormEnabled,
        liveSessions: organization.liveSessionsEnabled,
        sso: organization.ssoEnabled,
      },
      branding: organization.branding,
      settings: organization.settings,
      isActive: organization.isActive,
      isVerified: organization.isVerified,
      createdAt: organization.createdAt,
    };
  }

  /**
   * Get organization by slug
   */
  @Get('slug/:slug')
  async getOrganizationBySlug(@Param('slug') slug: string) {
    const organization = await this.organizationService.getOrganizationBySlug(slug);

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      description: organization.description,
      logo: organization.logo,
      branding: organization.branding,
    };
  }

  /**
   * Get user's organizations
   */
  @Get('user/me')
  @UseGuards(JwtAuthGuard)
  async getUserOrganizations(@CurrentUser() user: User) {
    const organizations = await this.organizationService.getUserOrganizations(user.id);

    return {
      organizations: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        isActive: org.isActive,
      })),
    };
  }

  /**
   * Update organization
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateOrganization(
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Body()
    body: {
      name?: string;
      description?: string;
      logo?: string;
      domain?: string;
      branding?: any;
      settings?: any;
    },
  ) {
    const organization = await this.organizationService.updateOrganization(id, user.id, body);

    return {
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        description: organization.description,
        logo: organization.logo,
        domain: organization.domain,
        branding: organization.branding,
        settings: organization.settings,
      },
    };
  }

  /**
   * Delete organization
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteOrganization(@CurrentUser() user: User, @Param('id') id: number) {
    await this.organizationService.deleteOrganization(id, user.id);

    return {
      success: true,
      message: 'Organization deleted',
    };
  }

  /**
   * Get organization members
   */
  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  async getOrganizationMembers(@Param('id') id: number) {
    const members = await this.organizationService.getOrganizationMembers(id);

    return {
      members: members.map((m) => ({
        id: m.id,
        user: {
          id: m.user.id,
          firstName: m.user.firstName,
          lastName: m.user.lastName,
          email: m.user.email,
        },
        role: m.role,
        permissions: m.permissions,
        isActive: m.isActive,
        joinedAt: m.joinedAt,
      })),
    };
  }

  /**
   * Invite member
   */
  @Post(':id/members')
  @UseGuards(JwtAuthGuard)
  async inviteMember(
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Body()
    body: {
      email: string;
      role: 'admin' | 'manager' | 'instructor' | 'member';
      permissions?: string[];
    },
  ) {
    const member = await this.organizationService.inviteMember(id, user.id, body);

    return {
      success: true,
      member: {
        id: member.id,
        userId: member.userId,
        role: member.role,
        permissions: member.permissions,
        joinedAt: member.joinedAt,
      },
      message: 'Member invited successfully',
    };
  }

  /**
   * Remove member
   */
  @Delete(':id/members/:memberId')
  @UseGuards(JwtAuthGuard)
  async removeMember(
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Param('memberId') memberId: number,
  ) {
    await this.organizationService.removeMember(id, user.id, memberId);

    return {
      success: true,
      message: 'Member removed',
    };
  }

  /**
   * Update member role
   */
  @Patch(':id/members/:memberId')
  @UseGuards(JwtAuthGuard)
  async updateMemberRole(
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Param('memberId') memberId: number,
    @Body() body: { role: string; permissions?: string[] },
  ) {
    const member = await this.organizationService.updateMemberRole(
      id,
      user.id,
      memberId,
      body.role,
      body.permissions,
    );

    return {
      success: true,
      member: {
        id: member.id,
        role: member.role,
        permissions: member.permissions,
      },
    };
  }

  /**
   * Configure SSO
   */
  @Post(':id/sso')
  @UseGuards(JwtAuthGuard)
  async configureSso(
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Body() body: { provider: string; config: any },
  ) {
    const organization = await this.organizationService.configureSso(
      id,
      user.id,
      body.provider,
      body.config,
    );

    return {
      success: true,
      sso: {
        enabled: organization.ssoEnabled,
        provider: organization.ssoProvider,
      },
      message: 'SSO configured successfully',
    };
  }

  /**
   * Generate API keys
   */
  @Post(':id/api-keys/generate')
  @UseGuards(JwtAuthGuard)
  async generateApiKeys(@CurrentUser() user: User, @Param('id') id: number) {
    const keys = await this.organizationService.generateApiKeys(id, user.id);

    return {
      success: true,
      apiKey: keys.apiKey,
      apiSecret: keys.apiSecret,
      message: 'API keys generated. Save the secret securely - it will not be shown again.',
    };
  }

  /**
   * Get organization by domain (for white-label access)
   */
  @Get('domain/:domain')
  async getOrganizationByDomain(@Param('domain') domain: string) {
    const organization = await this.organizationService.getOrganizationByDomain(domain);

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      branding: organization.branding,
    };
  }
}
