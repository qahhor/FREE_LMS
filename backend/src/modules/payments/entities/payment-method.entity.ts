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
import { PaymentGateway } from './payment.entity';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id: number;

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
  gateway: PaymentGateway;

  // Tokenized payment method (from Stripe, etc.)
  @Column()
  token: string;

  // Card details (for display)
  @Column({ nullable: true })
  last4: string;

  @Column({ name: 'card_type', nullable: true })
  cardType: string; // visa, mastercard, uzcard, humo

  @Column({ name: 'expiry_month', nullable: true })
  expiryMonth: string;

  @Column({ name: 'expiry_year', nullable: true })
  expiryYear: string;

  @Column({ name: 'billing_name', nullable: true })
  billingName: string;

  @Column({ name: 'billing_email', nullable: true })
  billingEmail: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
