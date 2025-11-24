import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import {
  SubscriptionPlan,
  SubscriptionTier,
  BillingPeriod,
} from '../entities/subscription-plan.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order.entity';
import { PaymentService } from './payment.service';
import { PaymentGateway, Currency } from '../entities/payment.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

interface CreateSubscriptionDto {
  userId: number;
  planId: number;
  gateway: PaymentGateway;
  autoRenew?: boolean;
}

interface UpgradeSubscriptionDto {
  planId: number;
  prorated?: boolean;
}

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private paymentService: PaymentService,
  ) {}

  /**
   * Get all subscription plans
   */
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepository.find({
      where: { isActive: true },
      order: { priceUsd: 'ASC' },
    });
  }

  /**
   * Get plan by ID
   */
  async getPlanById(id: number): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({
      where: { id, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  /**
   * Get plan by tier
   */
  async getPlanByTier(tier: SubscriptionTier, period: BillingPeriod): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({
      where: { tier, billingPeriod: period, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  /**
   * Create subscription
   */
  async createSubscription(dto: CreateSubscriptionDto): Promise<{ subscription: Subscription; order: Order }> {
    // Check if user already has an active subscription
    const existing = await this.subscriptionRepository.findOne({
      where: {
        userId: dto.userId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (existing) {
      throw new BadRequestException('User already has an active subscription');
    }

    // Get plan
    const plan = await this.getPlanById(dto.planId);

    if (plan.tier === SubscriptionTier.FREE) {
      // Free plan - activate immediately
      const subscription = this.subscriptionRepository.create({
        userId: dto.userId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        autoRenew: false,
        coursesUsed: 0,
        studentsUsed: 0,
        storageUsedGb: 0,
      });

      await this.subscriptionRepository.save(subscription);

      return { subscription, order: null };
    }

    // Paid plan - create order and payment
    const trialDays = plan.trialDays || 0;
    const now = new Date();
    const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const subscription = this.subscriptionRepository.create({
      userId: dto.userId,
      planId: plan.id,
      status: trialDays > 0 ? SubscriptionStatus.TRIALING : SubscriptionStatus.PENDING,
      trialStart: trialDays > 0 ? now : null,
      trialEnd: trialDays > 0 ? trialEnd : null,
      currentPeriodStart: trialDays > 0 ? trialEnd : now,
      autoRenew: dto.autoRenew ?? true,
      coursesUsed: 0,
      studentsUsed: 0,
      storageUsedGb: 0,
    });

    await this.subscriptionRepository.save(subscription);

    // Create order
    const order = await this.createOrderForSubscription(subscription, plan, dto.gateway);

    return { subscription, order };
  }

  /**
   * Create order for subscription
   */
  private async createOrderForSubscription(
    subscription: Subscription,
    plan: SubscriptionPlan,
    gateway: PaymentGateway,
  ): Promise<Order> {
    const orderNumber = this.generateOrderNumber();

    const order = this.orderRepository.create({
      orderNumber,
      userId: subscription.userId,
      subscriptionId: subscription.id,
      status: 'pending',
      currency: gateway === PaymentGateway.STRIPE ? Currency.USD : Currency.UZS,
      subtotal: gateway === PaymentGateway.STRIPE ? plan.priceUsd : plan.priceUzs,
      discount: 0,
      total: gateway === PaymentGateway.STRIPE ? plan.priceUsd : plan.priceUzs,
      items: [],
    });

    await this.orderRepository.save(order);

    // Create order item
    const item = this.orderItemRepository.create({
      orderId: order.id,
      itemType: 'subscription',
      itemId: plan.id,
      name: `${plan.name} - ${plan.billingPeriod}`,
      description: plan.description,
      quantity: 1,
      price: gateway === PaymentGateway.STRIPE ? plan.priceUsd : plan.priceUzs,
      total: gateway === PaymentGateway.STRIPE ? plan.priceUsd : plan.priceUzs,
    });

    await this.orderItemRepository.save(item);

    // Reload with items
    return this.orderRepository.findOne({
      where: { id: order.id },
      relations: ['items'],
    });
  }

  /**
   * Get user's subscription
   */
  async getUserSubscription(userId: number): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: number, immediate: boolean = false): Promise<Subscription> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription.isUsable()) {
      throw new BadRequestException('Subscription is not active');
    }

    if (immediate) {
      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.cancelledAt = new Date();
    } else {
      subscription.autoRenew = false;
      subscription.cancelledAt = new Date();
      // Will expire at currentPeriodEnd
    }

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(userId: number): Promise<Subscription> {
    const subscription = await this.getUserSubscription(userId);

    if (subscription.status !== SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Can only reactivate cancelled subscriptions');
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.autoRenew = true;
    subscription.cancelledAt = null;

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(
    userId: number,
    dto: UpgradeSubscriptionDto,
  ): Promise<{ subscription: Subscription; order: Order }> {
    const currentSubscription = await this.getUserSubscription(userId);
    const newPlan = await this.getPlanById(dto.planId);

    if (!currentSubscription.isUsable()) {
      throw new BadRequestException('Current subscription is not active');
    }

    // Check if it's actually an upgrade
    const tierOrder = [
      SubscriptionTier.FREE,
      SubscriptionTier.BASIC,
      SubscriptionTier.PRO,
      SubscriptionTier.BUSINESS,
      SubscriptionTier.ENTERPRISE,
    ];

    const currentTierIndex = tierOrder.indexOf(currentSubscription.plan.tier);
    const newTierIndex = tierOrder.indexOf(newPlan.tier);

    if (newTierIndex <= currentTierIndex) {
      throw new BadRequestException('Can only upgrade to a higher tier');
    }

    // Calculate prorated amount
    let amount = newPlan.priceUsd;

    if (dto.prorated) {
      const remainingDays = Math.ceil(
        (currentSubscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      const totalDays =
        currentSubscription.plan.billingPeriod === BillingPeriod.MONTHLY
          ? 30
          : currentSubscription.plan.billingPeriod === BillingPeriod.QUARTERLY
          ? 90
          : 365;

      const unusedCredit = (currentSubscription.plan.priceUsd / totalDays) * remainingDays;
      amount = Math.max(0, newPlan.priceUsd - unusedCredit);
    }

    // Create new subscription
    const newSubscription = this.subscriptionRepository.create({
      userId,
      planId: newPlan.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: currentSubscription.currentPeriodEnd,
      autoRenew: currentSubscription.autoRenew,
      coursesUsed: currentSubscription.coursesUsed,
      studentsUsed: currentSubscription.studentsUsed,
      storageUsedGb: currentSubscription.storageUsedGb,
    });

    // Cancel old subscription
    currentSubscription.status = SubscriptionStatus.CANCELLED;
    currentSubscription.cancelledAt = new Date();

    await this.subscriptionRepository.save(currentSubscription);
    await this.subscriptionRepository.save(newSubscription);

    // Create order for upgrade if amount > 0
    let order: Order = null;

    if (amount > 0) {
      order = await this.createOrderForSubscription(
        newSubscription,
        newPlan,
        PaymentGateway.STRIPE, // Default to Stripe for upgrades
      );

      // Override amount with prorated amount
      order.total = amount;
      order.subtotal = amount;
      await this.orderRepository.save(order);
    }

    return { subscription: newSubscription, order };
  }

  /**
   * Renew subscription
   */
  async renewSubscription(userId: number): Promise<{ subscription: Subscription; order: Order }> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription.autoRenew) {
      throw new BadRequestException('Auto-renew is disabled');
    }

    const plan = subscription.plan;

    // Create order for renewal
    const order = await this.createOrderForSubscription(
      subscription,
      plan,
      PaymentGateway.STRIPE, // Use last payment method's gateway
    );

    return { subscription, order };
  }

  /**
   * Track usage
   */
  async trackCourseUsage(userId: number, increment: number = 1): Promise<void> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription.canCreateCourse()) {
      throw new BadRequestException('Course limit reached');
    }

    subscription.coursesUsed += increment;
    await this.subscriptionRepository.save(subscription);
  }

  async trackStudentUsage(userId: number, increment: number = 1): Promise<void> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription.canAddStudent()) {
      throw new BadRequestException('Student limit reached');
    }

    subscription.studentsUsed += increment;
    await this.subscriptionRepository.save(subscription);
  }

  async trackStorageUsage(userId: number, sizeGb: number): Promise<void> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription.canUpload(sizeGb)) {
      throw new BadRequestException('Storage limit reached');
    }

    subscription.storageUsedGb = Number(subscription.storageUsedGb) + sizeGb;
    await this.subscriptionRepository.save(subscription);
  }

  /**
   * Check subscription status and limits
   */
  async checkLimit(userId: number, type: 'course' | 'student' | 'storage', value?: number): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription.isUsable()) {
      return false;
    }

    switch (type) {
      case 'course':
        return subscription.canCreateCourse();
      case 'student':
        return subscription.canAddStudent();
      case 'storage':
        return subscription.canUpload(value || 0);
      default:
        return false;
    }
  }

  /**
   * Cron job: Check and expire subscriptions
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireSubscriptions(): Promise<void> {
    const now = new Date();

    // Expire trial subscriptions
    const trialExpired = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.TRIALING,
      },
    });

    for (const subscription of trialExpired) {
      if (subscription.trialEnd < now) {
        if (subscription.autoRenew) {
          // Try to charge
          subscription.status = SubscriptionStatus.PENDING;
        } else {
          subscription.status = SubscriptionStatus.EXPIRED;
        }
        await this.subscriptionRepository.save(subscription);
      }
    }

    // Expire active subscriptions
    const activeExpired = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
    });

    for (const subscription of activeExpired) {
      if (subscription.currentPeriodEnd < now) {
        if (subscription.autoRenew) {
          // Try to renew
          subscription.status = SubscriptionStatus.PENDING;
        } else {
          subscription.status = SubscriptionStatus.EXPIRED;
        }
        await this.subscriptionRepository.save(subscription);
      }
    }

    // Mark past_due subscriptions as expired after 7 days
    const pastDueExpired = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.PAST_DUE,
      },
    });

    for (const subscription of pastDueExpired) {
      const daysPastDue = Math.floor(
        (now.getTime() - subscription.currentPeriodEnd.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysPastDue > 7) {
        subscription.status = SubscriptionStatus.EXPIRED;
        await this.subscriptionRepository.save(subscription);
      }
    }
  }

  /**
   * Generate unique order number
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }
}
