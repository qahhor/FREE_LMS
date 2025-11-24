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

export enum PaymentGateway {
  PAYME = 'payme',
  CLICK = 'click',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum Currency {
  UZS = 'UZS', // Uzbekistan Sum
  USD = 'USD',
  EUR = 'EUR',
  RUB = 'RUB',
}

export enum PaymentItemType {
  COURSE = 'course',
  SUBSCRIPTION = 'subscription',
  BUNDLE = 'bundle',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'payment_id' })
  paymentId: string; // PAY-2024-XXXXXX

  @Column({ name: 'external_id', nullable: true })
  @Index()
  externalId: string; // Gateway transaction ID

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @Column({
    type: 'enum',
    enum: PaymentGateway,
  })
  @Index()
  gateway: PaymentGateway;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.UZS,
  })
  currency: Currency;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Index()
  status: PaymentStatus;

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod: string; // card, uzcard, humo, paypal

  @Column({ name: 'payment_method_details', type: 'json', nullable: true })
  paymentMethodDetails: {
    brand?: string; // uzcard, humo, visa, mastercard
    last4?: string;
    phone?: string; // for Payme/Click
  };

  // What was purchased
  @Column({
    type: 'enum',
    enum: PaymentItemType,
    name: 'item_type',
  })
  itemType: PaymentItemType;

  @Column({ name: 'item_id' })
  itemId: number;

  @Column({ type: 'json', nullable: true })
  metadata: {
    courseName?: string;
    subscriptionPlan?: string;
    bundleName?: string;
    [key: string]: any;
  };

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 15, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ name: 'refunded_at', nullable: true })
  refundedAt: Date;

  // Gateway-specific data
  @Column({ name: 'gateway_data', type: 'json', nullable: true })
  gatewayData: {
    // Payme specific
    paymeTransactionId?: string;
    paymeState?: number;
    paymeTime?: number;

    // Click specific
    clickTransId?: string;
    clickPaydocId?: string;

    // Stripe specific
    stripePaymentIntentId?: string;
    stripeChargeId?: string;
  };

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;
}
