import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SubscriptionPlan } from '../../payments/entities/subscription-plan.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  domain: string; // Custom domain: learn.company.com

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @ManyToOne(() => SubscriptionPlan, { nullable: true })
  @JoinColumn({ name: 'subscription_plan_id' })
  subscriptionPlan: SubscriptionPlan;

  @Column({ name: 'subscription_plan_id', nullable: true })
  subscriptionPlanId: number;

  // White-label / Branding
  @Column({ type: 'json', nullable: true })
  branding: {
    primaryColor?: string;
    secondaryColor?: string;
    logo?: string;
    logoLight?: string; // for dark backgrounds
    favicon?: string;
    customCss?: string;
    customJs?: string;
    headerHtml?: string;
    footerHtml?: string;
  };

  // SSO Configuration
  @Column({ name: 'sso_enabled', default: false })
  ssoEnabled: boolean;

  @Column({ name: 'sso_provider', nullable: true })
  ssoProvider: string; // saml, oauth2, oidc, ldap

  @Column({ name: 'sso_config', type: 'json', nullable: true })
  ssoConfig: {
    // SAML
    entityId?: string;
    ssoUrl?: string;
    sloUrl?: string;
    certificate?: string;

    // OAuth2/OIDC
    clientId?: string;
    clientSecret?: string;
    authorizationUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;

    // LDAP
    ldapUrl?: string;
    ldapBaseDn?: string;
    ldapBindDn?: string;
    ldapBindPassword?: string;
    ldapSearchFilter?: string;
  };

  // Seats & Limits
  @Column({ name: 'max_seats', nullable: true })
  maxSeats: number;

  @Column({ name: 'used_seats', default: 0 })
  usedSeats: number;

  @Column({ name: 'max_courses', nullable: true })
  maxCourses: number;

  @Column({ name: 'used_courses', default: 0 })
  usedCourses: number;

  // Features
  @Column({ name: 'white_label_enabled', default: false })
  whiteLabelEnabled: boolean;

  @Column({ name: 'custom_domain_enabled', default: false })
  customDomainEnabled: boolean;

  @Column({ name: 'api_access_enabled', default: false })
  apiAccessEnabled: boolean;

  @Column({ name: 'scorm_enabled', default: false })
  scormEnabled: boolean;

  @Column({ name: 'live_sessions_enabled', default: false })
  liveSessionsEnabled: boolean;

  // API Keys
  @Column({ name: 'api_key', nullable: true, unique: true })
  @Index()
  apiKey: string;

  @Column({ name: 'api_secret', nullable: true })
  apiSecret: string;

  // Settings
  @Column({ type: 'json', nullable: true })
  settings: {
    language?: string;
    timezone?: string;
    dateFormat?: string;
    currency?: string;
    emailDomain?: string;
    allowedDomains?: string[]; // Email domains allowed to auto-join
    requireApproval?: boolean;
  };

  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('organization_members')
export class OrganizationMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  @Index()
  organizationId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @Column({ default: 'member' })
  role: 'owner' | 'admin' | 'manager' | 'instructor' | 'member';

  @Column({ type: 'json', nullable: true })
  permissions: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'joined_at' })
  joinedAt: Date;

  @Column({ name: 'invited_by', nullable: true })
  invitedBy: number;

  @Index(['organizationId', 'userId'], { unique: true })
}
