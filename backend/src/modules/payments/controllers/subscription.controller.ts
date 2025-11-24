import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { PaymentService } from '../services/payment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { PaymentGateway } from '../entities/payment.entity';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Get all subscription plans
   */
  @Get('plans')
  async getAllPlans() {
    const plans = await this.subscriptionService.getAllPlans();

    return {
      plans: plans.map((p) => ({
        id: p.id,
        tier: p.tier,
        name: p.name,
        description: p.description,
        billingPeriod: p.billingPeriod,
        priceUsd: p.priceUsd,
        priceUzs: p.priceUzs,
        priceRub: p.priceRub,
        priceEur: p.priceEur,
        trialDays: p.trialDays,
        features: {
          maxCourses: p.maxCourses,
          maxStudents: p.maxStudents,
          storageGb: p.storageGb,
          videoHours: p.videoHours,
          liveSessions: p.liveSessions,
          customDomain: p.customDomain,
          whiteLabel: p.whiteLabel,
          ssoEnabled: p.ssoEnabled,
          scormSupport: p.scormSupport,
          apiAccess: p.apiAccess,
          advancedAnalytics: p.advancedAnalytics,
          prioritySupport: p.prioritySupport,
          dedicatedManager: p.dedicatedManager,
        },
        isPopular: p.isPopular,
      })),
    };
  }

  /**
   * Get plan by ID
   */
  @Get('plans/:id')
  async getPlanById(@Param('id') id: number) {
    const plan = await this.subscriptionService.getPlanById(id);

    return {
      id: plan.id,
      tier: plan.tier,
      name: plan.name,
      description: plan.description,
      billingPeriod: plan.billingPeriod,
      priceUsd: plan.priceUsd,
      priceUzs: plan.priceUzs,
      trialDays: plan.trialDays,
      features: {
        maxCourses: plan.maxCourses,
        maxStudents: plan.maxStudents,
        storageGb: plan.storageGb,
        videoHours: plan.videoHours,
        customDomain: plan.customDomain,
        whiteLabel: plan.whiteLabel,
      },
    };
  }

  /**
   * Subscribe to a plan
   */
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(
    @CurrentUser() user: User,
    @Body()
    body: {
      planId: number;
      gateway: PaymentGateway;
      autoRenew?: boolean;
    },
  ) {
    const { subscription, order } = await this.subscriptionService.createSubscription({
      userId: user.id,
      planId: body.planId,
      gateway: body.gateway,
      autoRenew: body.autoRenew,
    });

    // If there's an order (paid plan), create payment
    let paymentData = null;
    if (order) {
      const payment = await this.paymentService.createPayment({
        userId: user.id,
        orderId: order.id,
        subscriptionId: subscription.id,
        amount: order.total,
        currency: order.currency,
        gateway: body.gateway,
        description: `Subscription: ${subscription.plan.name}`,
      });

      paymentData = await this.paymentService.processPayment(payment.paymentId);
    }

    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          tier: subscription.plan.tier,
        },
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEnd: subscription.trialEnd,
        autoRenew: subscription.autoRenew,
      },
      order: order
        ? {
            id: order.id,
            orderNumber: order.orderNumber,
            total: order.total,
            currency: order.currency,
          }
        : null,
      payment: paymentData,
    };
  }

  /**
   * Get current user's subscription
   */
  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentSubscription(@CurrentUser() user: User) {
    const subscription = await this.subscriptionService.getUserSubscription(user.id);

    return {
      id: subscription.id,
      status: subscription.status,
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        tier: subscription.plan.tier,
        description: subscription.plan.description,
        features: {
          maxCourses: subscription.plan.maxCourses,
          maxStudents: subscription.plan.maxStudents,
          storageGb: subscription.plan.storageGb,
          videoHours: subscription.plan.videoHours,
          customDomain: subscription.plan.customDomain,
          whiteLabel: subscription.plan.whiteLabel,
        },
      },
      usage: {
        coursesUsed: subscription.coursesUsed,
        studentsUsed: subscription.studentsUsed,
        storageUsedGb: subscription.storageUsedGb,
      },
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialStart: subscription.trialStart,
      trialEnd: subscription.trialEnd,
      autoRenew: subscription.autoRenew,
      cancelledAt: subscription.cancelledAt,
      createdAt: subscription.createdAt,
    };
  }

  /**
   * Cancel subscription
   */
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(
    @CurrentUser() user: User,
    @Body() body: { immediate?: boolean },
  ) {
    const subscription = await this.subscriptionService.cancelSubscription(
      user.id,
      body.immediate,
    );

    return {
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelledAt: subscription.cancelledAt,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      message: body.immediate
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at the end of the billing period',
    };
  }

  /**
   * Reactivate subscription
   */
  @Post('reactivate')
  @UseGuards(JwtAuthGuard)
  async reactivateSubscription(@CurrentUser() user: User) {
    const subscription = await this.subscriptionService.reactivateSubscription(user.id);

    return {
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        autoRenew: subscription.autoRenew,
      },
      message: 'Subscription reactivated',
    };
  }

  /**
   * Upgrade subscription
   */
  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  async upgradeSubscription(
    @CurrentUser() user: User,
    @Body() body: { planId: number; prorated?: boolean },
  ) {
    const { subscription, order } = await this.subscriptionService.upgradeSubscription(user.id, {
      planId: body.planId,
      prorated: body.prorated ?? true,
    });

    // Create payment if there's an order
    let paymentData = null;
    if (order && order.total > 0) {
      const payment = await this.paymentService.createPayment({
        userId: user.id,
        orderId: order.id,
        subscriptionId: subscription.id,
        amount: order.total,
        currency: order.currency,
        gateway: PaymentGateway.STRIPE, // Default to Stripe for upgrades
        description: `Upgrade to ${subscription.plan.name}`,
      });

      paymentData = await this.paymentService.processPayment(payment.paymentId);
    }

    return {
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          tier: subscription.plan.tier,
        },
      },
      order: order
        ? {
            id: order.id,
            orderNumber: order.orderNumber,
            total: order.total,
          }
        : null,
      payment: paymentData,
      message: 'Subscription upgraded successfully',
    };
  }

  /**
   * Check usage limits
   */
  @Get('limits/check')
  @UseGuards(JwtAuthGuard)
  async checkLimits(
    @CurrentUser() user: User,
    @Query('type') type: 'course' | 'student' | 'storage',
    @Query('value') value?: number,
  ) {
    const canProceed = await this.subscriptionService.checkLimit(user.id, type, value);

    return {
      type,
      canProceed,
      message: canProceed ? 'Within limits' : 'Limit reached',
    };
  }

  /**
   * Get usage statistics
   */
  @Get('usage')
  @UseGuards(JwtAuthGuard)
  async getUsage(@CurrentUser() user: User) {
    const subscription = await this.subscriptionService.getUserSubscription(user.id);

    const calculatePercentage = (used: number, max: number | null) => {
      if (!max) return 0; // Unlimited
      return Math.round((used / max) * 100);
    };

    return {
      courses: {
        used: subscription.coursesUsed,
        max: subscription.plan.maxCourses,
        percentage: calculatePercentage(subscription.coursesUsed, subscription.plan.maxCourses),
        unlimited: !subscription.plan.maxCourses,
      },
      students: {
        used: subscription.studentsUsed,
        max: subscription.plan.maxStudents,
        percentage: calculatePercentage(subscription.studentsUsed, subscription.plan.maxStudents),
        unlimited: !subscription.plan.maxStudents,
      },
      storage: {
        used: Number(subscription.storageUsedGb),
        max: subscription.plan.storageGb,
        percentage: calculatePercentage(
          Number(subscription.storageUsedGb),
          subscription.plan.storageGb,
        ),
        unlimited: !subscription.plan.storageGb,
        unit: 'GB',
      },
    };
  }
}
