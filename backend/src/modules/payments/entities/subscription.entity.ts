import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  EXPIRED = 'expired',
  TRIALING = 'trialing',
  SUSPENDED = 'suspended',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @ManyToOne(() => SubscriptionPlan, { eager: true })
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @Column({ name: 'plan_id' })
  planId: number;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  @Index()
  status: SubscriptionStatus;

  // Gateway subscription IDs
  @Column({ name: 'stripe_subscription_id', nullable: true })
  stripeSubscriptionId: string;

  @Column({ name: 'payme_subscription_id', nullable: true })
  paymeSubscriptionId: string;

  @Column({ name: 'current_period_start' })
  @Index()
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end' })
  @Index()
  currentPeriodEnd: Date;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: 'cancelled_at', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'trial_start', nullable: true })
  trialStart: Date;

  @Column({ name: 'trial_end', nullable: true })
  trialEnd: Date;

  @Column({ name: 'auto_renew', default: true })
  autoRenew: boolean;

  // Usage tracking
  @Column({ name: 'courses_used', default: 0 })
  coursesUsed: number;

  @Column({ name: 'students_used', default: 0 })
  studentsUsed: number;

  @Column({ name: 'storage_used_gb', type: 'decimal', precision: 10, scale: 2, default: 0 })
  storageUsedGb: number;

  @Column({ name: 'video_hours_used', type: 'decimal', precision: 10, scale: 2, default: 0 })
  videoHoursUsed: number;

  @Column({ name: 'live_sessions_used', default: 0 })
  liveSessionsUsed: number;

  @Column({ type: 'json', nullable: true })
  metadata: {
    lastPaymentId?: number;
    cancelReason?: string;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method to check if subscription is usable
  isUsable(): boolean {
    return (
      this.status === SubscriptionStatus.ACTIVE ||
      this.status === SubscriptionStatus.TRIALING
    );
  }

  // Helper method to check if trial
  isOnTrial(): boolean {
    return (
      this.status === SubscriptionStatus.TRIALING &&
      this.trialEnd &&
      new Date() < this.trialEnd
    );
  }

  // Helper method to check limits
  canCreateCourse(): boolean {
    if (!this.plan.maxCourses) return true; // unlimited
    return this.coursesUsed < this.plan.maxCourses;
  }

  canAddStudent(): boolean {
    if (!this.plan.maxStudents) return true; // unlimited
    return this.studentsUsed < this.plan.maxStudents;
  }
}
