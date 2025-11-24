# Phase 3: Monetization & Enterprise - Architecture

## 📋 Phase 3 Goals

**Primary Objective:** Build robust monetization and enterprise features

**Target Metrics:**
- $50K+ MRR (Monthly Recurring Revenue)
- 100+ paying customers
- 10+ enterprise clients
- 95%+ payment success rate
- <1% churn rate

---

## 🏗️ System Architecture

### 1. 💳 Payment System

#### Backend Entities:

```typescript
// PaymentGateway - Supported payment providers
export enum PaymentGateway {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  RAZORPAY = 'razorpay',
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
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  RUB = 'RUB',
}

// Payment - Payment transactions
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  paymentId: string; // Our internal ID (PAY-XXXX)

  @Column({ name: 'external_id', nullable: true })
  externalId: string; // Gateway transaction ID

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    type: 'enum',
    enum: PaymentGateway,
  })
  gateway: PaymentGateway;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.USD,
  })
  currency: Currency;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod: string; // card, paypal, etc.

  @Column({ name: 'payment_method_details', type: 'json', nullable: true })
  paymentMethodDetails: {
    brand?: string; // visa, mastercard
    last4?: string;
    expiryMonth?: string;
    expiryYear?: string;
  };

  // What was purchased
  @Column({ name: 'item_type' })
  itemType: 'course' | 'subscription' | 'bundle';

  @Column({ name: 'item_id' })
  itemId: number;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ name: 'failure_reason', nullable: true })
  failureReason: string;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ name: 'refunded_at', nullable: true })
  refundedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Index(['userId', 'status'])
  @Index(['gateway', 'externalId'])
  @Index(['createdAt'])
}

// PaymentMethod - Saved payment methods
@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    type: 'enum',
    enum: PaymentGateway,
  })
  gateway: PaymentGateway;

  @Column({ name: 'external_id' })
  externalId: string; // Stripe payment method ID

  @Column()
  type: string; // card, paypal, bank_account

  @Column({ type: 'json' })
  details: {
    brand?: string;
    last4?: string;
    expiryMonth?: string;
    expiryYear?: string;
    email?: string; // for PayPal
  };

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### Payment Service:

```typescript
@Injectable()
export class PaymentService {
  async createPayment(
    userId: number,
    amount: number,
    currency: Currency,
    gateway: PaymentGateway,
    itemType: string,
    itemId: number,
  ): Promise<Payment>;

  async processPayment(paymentId: string): Promise<Payment>;

  async confirmPayment(paymentId: string, externalId: string): Promise<Payment>;

  async refundPayment(paymentId: string, amount?: number): Promise<Payment>;

  async getPaymentHistory(userId: number, filters?: any): Promise<Payment[]>;

  async savePaymentMethod(
    userId: number,
    gateway: PaymentGateway,
    externalId: string,
    details: any,
  ): Promise<PaymentMethod>;

  async getPaymentMethods(userId: number): Promise<PaymentMethod[]>;

  async deletePaymentMethod(methodId: number): Promise<void>;

  async setDefaultPaymentMethod(methodId: number): Promise<void>;

  // Gateway-specific methods
  async createStripePaymentIntent(amount: number, currency: Currency): Promise<any>;
  async createPayPalOrder(amount: number, currency: Currency): Promise<any>;
}
```

---

### 2. 📦 Subscription System

#### Backend Entities:

```typescript
export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  EXPIRED = 'expired',
  TRIALING = 'trialing',
}

export enum BillingPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

// SubscriptionPlan - Available plans
@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
  })
  tier: SubscriptionTier;

  @Column({
    type: 'enum',
    enum: BillingPeriod,
  })
  billingPeriod: BillingPeriod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.USD,
  })
  currency: Currency;

  // Features
  @Column({ name: 'max_courses', nullable: true })
  maxCourses: number; // null = unlimited

  @Column({ name: 'max_students', nullable: true })
  maxStudents: number;

  @Column({ name: 'storage_gb', nullable: true })
  storageGb: number;

  @Column({ name: 'video_hours', nullable: true })
  videoHours: number;

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

  @Column({ type: 'json', nullable: true })
  features: string[]; // Additional features

  @Column({ name: 'stripe_price_id', nullable: true })
  stripePriceId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'trial_days', default: 0 })
  trialDays: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// Subscription - User subscriptions
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @Column({ name: 'plan_id' })
  planId: number;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ name: 'stripe_subscription_id', nullable: true })
  stripeSubscriptionId: string;

  @Column({ name: 'current_period_start' })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end' })
  currentPeriodEnd: Date;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: 'cancelled_at', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'trial_end', nullable: true })
  trialEnd: Date;

  @Column({ name: 'auto_renew', default: true })
  autoRenew: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Index(['userId', 'status'])
  @Index(['status', 'currentPeriodEnd'])
}
```

---

### 3. 🛒 Shopping Cart & Checkout

#### Backend Entities:

```typescript
// Cart - Shopping cart
@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items: CartItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @ManyToOne(() => Coupon, { nullable: true })
  @JoinColumn({ name: 'coupon_id' })
  appliedCoupon: Coupon;

  @Column({ name: 'coupon_id', nullable: true })
  appliedCouponId: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// CartItem - Items in cart
@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cart, (cart) => cart.items)
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @Column({ name: 'cart_id' })
  cartId: number;

  @Column({ name: 'item_type' })
  itemType: 'course' | 'bundle' | 'subscription';

  @Column({ name: 'item_id' })
  itemId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 1 })
  quantity: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

---

### 4. 📋 Order Management

#### Backend Entities:

```typescript
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

// Order - Purchase orders
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  orderNumber: string; // ORD-YYYY-XXXXXX

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.USD,
  })
  currency: Currency;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ManyToOne(() => Payment, { nullable: true })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({ name: 'payment_id', nullable: true })
  paymentId: number;

  @ManyToOne(() => Coupon, { nullable: true })
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @Column({ name: 'coupon_id', nullable: true })
  couponId: number;

  @Column({ name: 'coupon_code', nullable: true })
  couponCode: string;

  @Column({ type: 'json', nullable: true })
  billingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    country: string;
    state?: string;
    city?: string;
    zipCode?: string;
    address?: string;
  };

  @Column({ name: 'invoice_url', nullable: true })
  invoiceUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Index(['userId', 'status'])
  @Index(['orderNumber'])
  @Index(['createdAt'])
}

// OrderItem - Items in order
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ name: 'item_type' })
  itemType: 'course' | 'bundle' | 'subscription';

  @Column({ name: 'item_id' })
  itemId: number;

  @Column({ name: 'item_name' })
  itemName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;
}
```

---

### 5. 🎟️ Coupon System

#### Backend Entities:

```typescript
export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  FREE_SHIPPING = 'free_shipping',
}

export enum CouponAppliesTo {
  ALL = 'all',
  COURSES = 'courses',
  BUNDLES = 'bundles',
  SUBSCRIPTIONS = 'subscriptions',
  SPECIFIC_ITEMS = 'specific_items',
}

// Coupon - Discount coupons
@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CouponType,
  })
  type: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number; // percentage or fixed amount

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.USD,
    nullable: true,
  })
  currency: Currency; // for fixed amount

  @Column({
    type: 'enum',
    enum: CouponAppliesTo,
    default: CouponAppliesTo.ALL,
  })
  appliesTo: CouponAppliesTo;

  @Column({ type: 'json', nullable: true })
  specificItems: number[]; // IDs of specific items

  @Column({ name: 'min_purchase', type: 'decimal', precision: 10, scale: 2, nullable: true })
  minPurchase: number;

  @Column({ name: 'max_uses', nullable: true })
  maxUses: number; // null = unlimited

  @Column({ name: 'used_count', default: 0 })
  usedCount: number;

  @Column({ name: 'max_uses_per_user', nullable: true })
  maxUsesPerUser: number;

  @Column({ name: 'valid_from' })
  validFrom: Date;

  @Column({ name: 'valid_until', nullable: true })
  validUntil: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Index(['code'])
  @Index(['isActive', 'validFrom', 'validUntil'])
}

// CouponUsage - Track coupon usage
@Entity('coupon_usage')
export class CouponUsage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @Column({ name: 'coupon_id' })
  couponId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountAmount: number;

  @CreateDateColumn({ name: 'used_at' })
  usedAt: Date;

  @Index(['couponId', 'userId'])
}
```

---

### 6. 🤝 Affiliate System

#### Backend Entities:

```typescript
export enum AffiliateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

export enum CommissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

// Affiliate - Affiliate partners
@Entity('affiliates')
export class Affiliate {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ unique: true })
  code: string; // Unique affiliate code

  @Column({
    type: 'enum',
    enum: AffiliateStatus,
    default: AffiliateStatus.PENDING,
  })
  status: AffiliateStatus;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2 })
  commissionRate: number; // percentage

  @Column({ name: 'total_clicks', default: 0 })
  totalClicks: number;

  @Column({ name: 'total_sales', default: 0 })
  totalSales: number;

  @Column({ name: 'total_commission', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCommission: number;

  @Column({ name: 'paid_commission', type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidCommission: number;

  @Column({ name: 'pending_commission', type: 'decimal', precision: 10, scale: 2, default: 0 })
  pendingCommission: number;

  @Column({ name: 'payment_email', nullable: true })
  paymentEmail: string;

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod: string; // paypal, bank_transfer, etc.

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// AffiliateClick - Track affiliate clicks
@Entity('affiliate_clicks')
export class AffiliateClick {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Affiliate)
  @JoinColumn({ name: 'affiliate_id' })
  affiliate: Affiliate;

  @Column({ name: 'affiliate_id' })
  affiliateId: number;

  @Column({ name: 'ip_address' })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text' })
  userAgent: string;

  @Column({ nullable: true })
  referer: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'converted_user_id' })
  convertedUser: User;

  @Column({ name: 'converted_user_id', nullable: true })
  convertedUserId: number;

  @Column({ name: 'converted', default: false })
  converted: boolean;

  @Column({ name: 'converted_at', nullable: true })
  convertedAt: Date;

  @CreateDateColumn({ name: 'clicked_at' })
  clickedAt: Date;

  @Index(['affiliateId', 'clickedAt'])
  @Index(['convertedUserId'])
}

// AffiliateCommission - Commission records
@Entity('affiliate_commissions')
export class AffiliateCommission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Affiliate)
  @JoinColumn({ name: 'affiliate_id' })
  affiliate: Affiliate;

  @Column({ name: 'affiliate_id' })
  affiliateId: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  orderAmount: number;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2 })
  commissionRate: number;

  @Column({ name: 'commission_amount', type: 'decimal', precision: 10, scale: 2 })
  commissionAmount: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.USD,
  })
  currency: Currency;

  @Column({
    type: 'enum',
    enum: CommissionStatus,
    default: CommissionStatus.PENDING,
  })
  status: CommissionStatus;

  @Column({ name: 'approved_at', nullable: true })
  approvedAt: Date;

  @Column({ name: 'paid_at', nullable: true })
  paidAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Index(['affiliateId', 'status'])
}
```

---

### 7. 🏢 Enterprise Features

#### Backend Entities:

```typescript
// Organization - Enterprise organizations
@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  domain: string; // Custom domain

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'subscription_plan_id' })
  subscriptionPlan: SubscriptionPlan;

  @Column({ name: 'subscription_plan_id' })
  subscriptionPlanId: number;

  // Branding
  @Column({ type: 'json', nullable: true })
  branding: {
    primaryColor?: string;
    secondaryColor?: string;
    logo?: string;
    favicon?: string;
    customCss?: string;
  };

  // SSO Configuration
  @Column({ name: 'sso_enabled', default: false })
  ssoEnabled: boolean;

  @Column({ type: 'json', nullable: true })
  ssoConfig: {
    provider?: string; // saml, oauth2, oidc
    entityId?: string;
    ssoUrl?: string;
    certificate?: string;
    clientId?: string;
    clientSecret?: string;
  };

  @Column({ name: 'max_seats', nullable: true })
  maxSeats: number;

  @Column({ name: 'used_seats', default: 0 })
  usedSeats: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// OrganizationMember - Team members
@Entity('organization_members')
export class OrganizationMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column()
  role: 'admin' | 'manager' | 'member';

  @Column({ name: 'joined_at' })
  joinedAt: Date;

  @Index(['organizationId', 'userId'], { unique: true })
}
```

---

## 📊 Implementation Priority

**Phase 1 (Core Monetization):**
1. Payment System (Stripe integration)
2. Course Pricing
3. Shopping Cart & Checkout
4. Order Management

**Phase 2 (Subscriptions):**
5. Subscription Plans
6. Subscription Management
7. Billing & Invoicing

**Phase 3 (Marketing):**
8. Coupon System
9. Affiliate Program

**Phase 4 (Enterprise):**
10. Organizations & Teams
11. SSO Integration
12. White-labeling
13. Custom Domains

---

## 🎯 Success Metrics

**Technical:**
- Payment success rate >95%
- Checkout abandonment <30%
- API response time <200ms
- Zero data breaches
- PCI compliance

**Business:**
- MRR growth rate >20%
- Customer LTV >$1000
- Churn rate <1%
- Affiliate conversion >5%
- Enterprise conversion >10%

---

*Phase 3 Architecture*
*Version: 1.0*
*Date: November 2024*
