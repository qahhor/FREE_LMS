import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentGateway, PaymentStatus, Currency } from '../entities/payment.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { Subscription } from '../entities/subscription.entity';
import { PaymentMethod } from '../entities/payment-method.entity';
import Stripe from 'stripe';
import * as crypto from 'crypto';

interface CreatePaymentDto {
  userId: number;
  orderId?: number;
  subscriptionId?: number;
  amount: number;
  currency: Currency;
  gateway: PaymentGateway;
  description?: string;
}

interface PaymeWebhookData {
  method: string;
  params: {
    id: string;
    time: number;
    amount: number;
    account: { order_id: string };
    state?: number;
    reason?: number;
  };
}

interface ClickWebhookData {
  click_trans_id: string;
  service_id: string;
  click_paydoc_id: string;
  merchant_trans_id: string;
  amount: number;
  action: number;
  error: number;
  error_note: string;
  sign_time: string;
  sign_string: string;
}

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
  ) {
    // Initialize Stripe
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-11-20.acacia',
    });
  }

  /**
   * Create a new payment
   */
  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    const paymentId = this.generatePaymentId();

    const payment = this.paymentRepository.create({
      paymentId,
      userId: dto.userId,
      orderId: dto.orderId,
      subscriptionId: dto.subscriptionId,
      amount: dto.amount,
      currency: dto.currency,
      gateway: dto.gateway,
      status: PaymentStatus.PENDING,
      description: dto.description,
      metadata: {},
      gatewayData: {},
    });

    return this.paymentRepository.save(payment);
  }

  /**
   * Process payment through gateway
   */
  async processPayment(paymentId: string): Promise<any> {
    const payment = await this.findByPaymentId(paymentId);

    switch (payment.gateway) {
      case PaymentGateway.PAYME:
        return this.processPaymePayment(payment);
      case PaymentGateway.CLICK:
        return this.processClickPayment(payment);
      case PaymentGateway.STRIPE:
        return this.processStripePayment(payment);
      default:
        throw new BadRequestException('Unsupported payment gateway');
    }
  }

  /**
   * Payme Payment Processing
   */
  private async processPaymePayment(payment: Payment): Promise<any> {
    // Payme uses Merchant API with webhook callbacks
    // Return payment URL for user to complete payment
    const paymeUrl = `https://checkout.paycom.uz/${process.env.PAYME_MERCHANT_ID}`;

    const params = Buffer.from(
      JSON.stringify({
        m: process.env.PAYME_MERCHANT_ID,
        ac: { order_id: payment.paymentId },
        a: Math.round(payment.amount * 100), // Amount in tiyin (1/100 UZS)
        c: payment.description || 'Course payment',
      })
    ).toString('base64');

    payment.status = PaymentStatus.PROCESSING;
    await this.paymentRepository.save(payment);

    return {
      paymentUrl: `${paymeUrl}?${params}`,
      paymentId: payment.paymentId,
    };
  }

  /**
   * Click Payment Processing
   */
  private async processClickPayment(payment: Payment): Promise<any> {
    // Click uses merchant API
    const clickUrl = 'https://my.click.uz/services/pay';

    const params = new URLSearchParams({
      service_id: process.env.CLICK_SERVICE_ID || '',
      merchant_id: process.env.CLICK_MERCHANT_ID || '',
      merchant_user_id: payment.userId.toString(),
      amount: payment.amount.toString(),
      transaction_param: payment.paymentId,
      return_url: `${process.env.FRONTEND_URL}/payment/success`,
      card_type: '1', // 1 = Uzcard, 2 = Humo
    });

    payment.status = PaymentStatus.PROCESSING;
    await this.paymentRepository.save(payment);

    return {
      paymentUrl: `${clickUrl}?${params.toString()}`,
      paymentId: payment.paymentId,
    };
  }

  /**
   * Stripe Payment Processing
   */
  private async processStripePayment(payment: Payment): Promise<any> {
    try {
      // Create Stripe Payment Intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(payment.amount * 100), // Amount in cents
        currency: payment.currency.toLowerCase(),
        metadata: {
          paymentId: payment.paymentId,
          userId: payment.userId.toString(),
          orderId: payment.orderId?.toString() || '',
        },
        description: payment.description,
      });

      // Update payment with Stripe data
      payment.externalId = paymentIntent.id;
      payment.gatewayData = {
        stripePaymentIntentId: paymentIntent.id,
      };
      payment.status = PaymentStatus.PROCESSING;
      await this.paymentRepository.save(payment);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.paymentId,
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      };
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = error.message;
      await this.paymentRepository.save(payment);
      throw error;
    }
  }

  /**
   * Handle Payme webhook
   */
  async handlePaymeWebhook(data: PaymeWebhookData): Promise<any> {
    const { method, params } = data;

    switch (method) {
      case 'CheckPerformTransaction':
        return this.paymeCheckPerformTransaction(params);
      case 'CreateTransaction':
        return this.paymeCreateTransaction(params);
      case 'PerformTransaction':
        return this.paymePerformTransaction(params);
      case 'CancelTransaction':
        return this.paymeCancelTransaction(params);
      case 'CheckTransaction':
        return this.paymeCheckTransaction(params);
      default:
        throw new BadRequestException('Unknown method');
    }
  }

  private async paymeCheckPerformTransaction(params: any): Promise<any> {
    const orderId = params.account.order_id;
    const payment = await this.findByPaymentId(orderId);

    if (!payment) {
      return { error: { code: -31050, message: 'Order not found' } };
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return { error: { code: -31051, message: 'Order already paid' } };
    }

    return { result: { allow: true } };
  }

  private async paymeCreateTransaction(params: any): Promise<any> {
    const orderId = params.account.order_id;
    const payment = await this.findByPaymentId(orderId);

    if (!payment) {
      return { error: { code: -31050, message: 'Order not found' } };
    }

    payment.externalId = params.id;
    payment.gatewayData = {
      paymeTransactionId: params.id,
      paymeTime: params.time,
      paymeState: 1, // Created
    };
    payment.status = PaymentStatus.PROCESSING;
    await this.paymentRepository.save(payment);

    return {
      result: {
        create_time: params.time,
        transaction: payment.id.toString(),
        state: 1,
      },
    };
  }

  private async paymePerformTransaction(params: any): Promise<any> {
    const payment = await this.paymentRepository.findOne({
      where: { externalId: params.id },
    });

    if (!payment) {
      return { error: { code: -31003, message: 'Transaction not found' } };
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.paidAt = new Date();
    payment.gatewayData = {
      ...payment.gatewayData,
      paymeState: 2, // Completed
    };
    await this.paymentRepository.save(payment);

    // Complete order/subscription
    await this.completePayment(payment);

    return {
      result: {
        transaction: payment.id.toString(),
        perform_time: Date.now(),
        state: 2,
      },
    };
  }

  private async paymeCancelTransaction(params: any): Promise<any> {
    const payment = await this.paymentRepository.findOne({
      where: { externalId: params.id },
    });

    if (!payment) {
      return { error: { code: -31003, message: 'Transaction not found' } };
    }

    payment.status = PaymentStatus.CANCELLED;
    payment.gatewayData = {
      ...payment.gatewayData,
      paymeState: -1, // Cancelled
      paymeReason: params.reason,
    };
    await this.paymentRepository.save(payment);

    return {
      result: {
        transaction: payment.id.toString(),
        cancel_time: Date.now(),
        state: -1,
      },
    };
  }

  private async paymeCheckTransaction(params: any): Promise<any> {
    const payment = await this.paymentRepository.findOne({
      where: { externalId: params.id },
    });

    if (!payment) {
      return { error: { code: -31003, message: 'Transaction not found' } };
    }

    return {
      result: {
        create_time: payment.createdAt.getTime(),
        perform_time: payment.paidAt?.getTime() || 0,
        cancel_time: 0,
        transaction: payment.id.toString(),
        state: payment.gatewayData?.paymeState || 1,
        reason: null,
      },
    };
  }

  /**
   * Handle Click webhook
   */
  async handleClickWebhook(data: ClickWebhookData): Promise<any> {
    const { action, merchant_trans_id } = data;

    if (action === 0) {
      // Prepare
      return this.clickPrepare(data);
    } else if (action === 1) {
      // Complete
      return this.clickComplete(data);
    }

    return { error: -8, error_note: 'Unknown action' };
  }

  private async clickPrepare(data: ClickWebhookData): Promise<any> {
    const payment = await this.findByPaymentId(data.merchant_trans_id);

    if (!payment) {
      return { error: -5, error_note: 'Order not found' };
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return { error: -4, error_note: 'Already paid' };
    }

    if (Math.abs(payment.amount - data.amount) > 0.01) {
      return { error: -2, error_note: 'Incorrect amount' };
    }

    payment.externalId = data.click_trans_id;
    payment.gatewayData = {
      clickTransId: data.click_trans_id,
      clickPaydocId: data.click_paydoc_id,
    };
    payment.status = PaymentStatus.PROCESSING;
    await this.paymentRepository.save(payment);

    return {
      click_trans_id: data.click_trans_id,
      merchant_trans_id: data.merchant_trans_id,
      merchant_prepare_id: payment.id,
      error: 0,
      error_note: 'Success',
    };
  }

  private async clickComplete(data: ClickWebhookData): Promise<any> {
    const payment = await this.paymentRepository.findOne({
      where: { externalId: data.click_trans_id },
    });

    if (!payment) {
      return { error: -5, error_note: 'Transaction not found' };
    }

    if (data.error < 0) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = data.error_note;
      await this.paymentRepository.save(payment);

      return {
        click_trans_id: data.click_trans_id,
        merchant_trans_id: data.merchant_trans_id,
        merchant_confirm_id: payment.id,
        error: data.error,
        error_note: data.error_note,
      };
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.paidAt = new Date();
    await this.paymentRepository.save(payment);

    // Complete order/subscription
    await this.completePayment(payment);

    return {
      click_trans_id: data.click_trans_id,
      merchant_trans_id: data.merchant_trans_id,
      merchant_confirm_id: payment.id,
      error: 0,
      error_note: 'Success',
    };
  }

  /**
   * Handle Stripe webhook
   */
  async handleStripeWebhook(signature: string, payload: Buffer): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || '',
      );
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handleStripePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handleStripePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        await this.handleStripeRefund(event.data.object as Stripe.Charge);
        break;
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  private async handleStripePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { externalId: paymentIntent.id },
    });

    if (!payment) {
      console.error('Payment not found for PaymentIntent:', paymentIntent.id);
      return;
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.paidAt = new Date();
    payment.gatewayData = {
      ...payment.gatewayData,
      stripeChargeId: paymentIntent.charges.data[0]?.id,
    };
    await this.paymentRepository.save(payment);

    // Complete order/subscription
    await this.completePayment(payment);
  }

  private async handleStripePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { externalId: paymentIntent.id },
    });

    if (!payment) {
      console.error('Payment not found for PaymentIntent:', paymentIntent.id);
      return;
    }

    payment.status = PaymentStatus.FAILED;
    payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
    await this.paymentRepository.save(payment);
  }

  private async handleStripeRefund(charge: Stripe.Charge): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { externalId: charge.payment_intent as string },
    });

    if (!payment) {
      console.error('Payment not found for charge:', charge.id);
      return;
    }

    payment.status = PaymentStatus.REFUNDED;
    payment.refundedAt = new Date();
    payment.refundAmount = charge.amount_refunded / 100;
    await this.paymentRepository.save(payment);
  }

  /**
   * Complete payment - update order/subscription
   */
  private async completePayment(payment: Payment): Promise<void> {
    if (payment.orderId) {
      const order = await this.orderRepository.findOne({
        where: { id: payment.orderId },
      });
      if (order) {
        order.status = OrderStatus.COMPLETED;
        order.paidAt = new Date();
        await this.orderRepository.save(order);
      }
    }

    if (payment.subscriptionId) {
      const subscription = await this.subscriptionRepository.findOne({
        where: { id: payment.subscriptionId },
      });
      if (subscription) {
        subscription.currentPeriodStart = new Date();
        const endDate = new Date();

        // Calculate end date based on billing period
        if (subscription.plan.billingPeriod === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (subscription.plan.billingPeriod === 'quarterly') {
          endDate.setMonth(endDate.getMonth() + 3);
        } else if (subscription.plan.billingPeriod === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        subscription.currentPeriodEnd = endDate;
        await this.subscriptionRepository.save(subscription);
      }
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<Payment> {
    const payment = await this.findByPaymentId(paymentId);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    const refundAmount = amount || payment.amount;

    try {
      if (payment.gateway === PaymentGateway.STRIPE) {
        await this.stripe.refunds.create({
          payment_intent: payment.externalId,
          amount: Math.round(refundAmount * 100),
          reason: reason as any,
        });
      }

      payment.status = PaymentStatus.REFUNDED;
      payment.refundAmount = refundAmount;
      payment.refundedAt = new Date();
      payment.failureReason = reason;

      return this.paymentRepository.save(payment);
    } catch (error) {
      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }

  /**
   * Get payment by ID
   */
  async findByPaymentId(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
      relations: ['user', 'order', 'subscription'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Get user payments
   */
  async getUserPayments(userId: number): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Generate unique payment ID
   */
  private generatePaymentId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-${timestamp}-${random}`;
  }

  /**
   * Save payment method
   */
  async savePaymentMethod(
    userId: number,
    gateway: PaymentGateway,
    token: string,
    details: any,
  ): Promise<PaymentMethod> {
    const paymentMethod = this.paymentMethodRepository.create({
      userId,
      gateway,
      token,
      last4: details.last4,
      cardType: details.cardType,
      expiryMonth: details.expiryMonth,
      expiryYear: details.expiryYear,
      isDefault: false,
    });

    return this.paymentMethodRepository.save(paymentMethod);
  }

  /**
   * Get user payment methods
   */
  async getUserPaymentMethods(userId: number): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find({
      where: { userId, isActive: true },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(userId: number, methodId: number): Promise<void> {
    const method = await this.paymentMethodRepository.findOne({
      where: { id: methodId, userId },
    });

    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    method.isActive = false;
    await this.paymentMethodRepository.save(method);
  }
}
