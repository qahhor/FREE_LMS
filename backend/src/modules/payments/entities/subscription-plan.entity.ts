import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Currency } from './payment.entity';

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

export enum BillingPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
  })
  @Index()
  tier: SubscriptionTier;

  @Column({
    type: 'enum',
    enum: BillingPeriod,
  })
  billingPeriod: BillingPeriod;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.UZS,
  })
  currency: Currency;

  // Features & Limits
  @Column({ name: 'max_courses', nullable: true })
  maxCourses: number; // null = unlimited

  @Column({ name: 'max_students', nullable: true })
  maxStudents: number;

  @Column({ name: 'max_instructors', nullable: true })
  maxInstructors: number;

  @Column({ name: 'storage_gb', nullable: true })
  storageGb: number;

  @Column({ name: 'video_hours', nullable: true })
  videoHours: number;

  @Column({ name: 'live_sessions', nullable: true })
  liveSessions: number; // per month

  @Column({ name: 'custom_domain', default: false })
  customDomain: boolean;

  @Column({ name: 'white_label', default: false })
  whiteLabel: boolean;

  @Column({ name: 'sso_enabled', default: false })
  ssoEnabled: boolean;

  @Column({ name: 'api_access', default: false })
  apiAccess: boolean;

  @Column({ name: 'priority_support', default: false })
  prioritySupport: boolean;

  @Column({ name: 'custom_branding', default: false })
  customBranding: boolean;

  @Column({ name: 'scorm_support', default: false })
  scormSupport: boolean;

  @Column({ name: 'advanced_analytics', default: false })
  advancedAnalytics: boolean;

  @Column({ name: 'certificates', default: true })
  certificates: boolean;

  @Column({ type: 'json', nullable: true })
  features: string[];

  // Gateway integration IDs
  @Column({ name: 'stripe_price_id', nullable: true })
  stripePriceId: string;

  @Column({ name: 'payme_product_id', nullable: true })
  paymeProductId: string;

  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;

  @Column({ name: 'is_popular', default: false })
  isPopular: boolean;

  @Column({ name: 'trial_days', default: 0 })
  trialDays: number;

  @Column({ name: 'discount_yearly', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountYearly: number; // percentage discount for yearly

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
