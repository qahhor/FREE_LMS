import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { PaymentGateway, Currency } from '../entities/payment.entity';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Create new payment
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @CurrentUser() user: User,
    @Body()
    body: {
      orderId?: number;
      subscriptionId?: number;
      amount: number;
      currency: Currency;
      gateway: PaymentGateway;
      description?: string;
    },
  ) {
    const payment = await this.paymentService.createPayment({
      userId: user.id,
      orderId: body.orderId,
      subscriptionId: body.subscriptionId,
      amount: body.amount,
      currency: body.currency,
      gateway: body.gateway,
      description: body.description,
    });

    // Process payment and get payment URL/data
    const paymentData = await this.paymentService.processPayment(payment.paymentId);

    return {
      payment: {
        id: payment.id,
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        gateway: payment.gateway,
      },
      ...paymentData,
    };
  }

  /**
   * Get payment by ID
   */
  @Get(':paymentId')
  @UseGuards(JwtAuthGuard)
  async getPayment(@CurrentUser() user: User, @Param('paymentId') paymentId: string) {
    const payment = await this.paymentService.findByPaymentId(paymentId);

    // Ensure user owns this payment
    if (payment.userId !== user.id) {
      return { error: 'Unauthorized' };
    }

    return {
      id: payment.id,
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      gateway: payment.gateway,
      description: payment.description,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      refundedAt: payment.refundedAt,
      refundAmount: payment.refundAmount,
    };
  }

  /**
   * Get user's payment history
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserPayments(@CurrentUser() user: User) {
    const payments = await this.paymentService.getUserPayments(user.id);

    return {
      payments: payments.map((p) => ({
        id: p.id,
        paymentId: p.paymentId,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        gateway: p.gateway,
        description: p.description,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
      })),
    };
  }

  /**
   * Refund payment
   */
  @Post(':paymentId/refund')
  @UseGuards(JwtAuthGuard)
  async refundPayment(
    @CurrentUser() user: User,
    @Param('paymentId') paymentId: string,
    @Body() body: { amount?: number; reason?: string },
  ) {
    // TODO: Add admin check here
    const payment = await this.paymentService.refundPayment(
      paymentId,
      body.amount,
      body.reason,
    );

    return {
      success: true,
      payment: {
        id: payment.id,
        paymentId: payment.paymentId,
        status: payment.status,
        refundAmount: payment.refundAmount,
        refundedAt: payment.refundedAt,
      },
    };
  }

  /**
   * Payme webhook
   */
  @Post('webhooks/payme')
  @HttpCode(HttpStatus.OK)
  async paymeWebhook(@Body() body: any, @Headers('authorization') authorization: string) {
    // Verify Payme authorization
    const expectedAuth = Buffer.from(
      `Paycom:${process.env.PAYME_MERCHANT_KEY}`,
    ).toString('base64');

    if (authorization !== `Basic ${expectedAuth}`) {
      return {
        error: {
          code: -32504,
          message: 'Insufficient privilege to perform this method',
        },
      };
    }

    try {
      const result = await this.paymentService.handlePaymeWebhook(body);
      return result;
    } catch (error) {
      return {
        error: {
          code: -32400,
          message: error.message,
        },
      };
    }
  }

  /**
   * Click webhook
   */
  @Post('webhooks/click')
  @HttpCode(HttpStatus.OK)
  async clickWebhook(@Body() body: any) {
    // Verify Click signature
    const secretKey = process.env.CLICK_SECRET_KEY || '';
    const signString = `${body.click_trans_id}${body.service_id}${secretKey}${body.merchant_trans_id}${body.amount}${body.action}${body.sign_time}`;

    const crypto = require('crypto');
    const expectedSign = crypto.createHash('md5').update(signString).digest('hex');

    if (body.sign_string !== expectedSign) {
      return {
        error: -1,
        error_note: 'Invalid signature',
      };
    }

    try {
      const result = await this.paymentService.handleClickWebhook(body);
      return result;
    } catch (error) {
      return {
        error: -9,
        error_note: error.message,
      };
    }
  }

  /**
   * Stripe webhook
   */
  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    try {
      await this.paymentService.handleStripeWebhook(signature, req.rawBody);
      return { received: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Save payment method
   */
  @Post('methods')
  @UseGuards(JwtAuthGuard)
  async savePaymentMethod(
    @CurrentUser() user: User,
    @Body()
    body: {
      gateway: PaymentGateway;
      token: string;
      last4?: string;
      cardType?: string;
      expiryMonth?: string;
      expiryYear?: string;
    },
  ) {
    const method = await this.paymentService.savePaymentMethod(
      user.id,
      body.gateway,
      body.token,
      {
        last4: body.last4,
        cardType: body.cardType,
        expiryMonth: body.expiryMonth,
        expiryYear: body.expiryYear,
      },
    );

    return {
      id: method.id,
      gateway: method.gateway,
      last4: method.last4,
      cardType: method.cardType,
      expiryMonth: method.expiryMonth,
      expiryYear: method.expiryYear,
      isDefault: method.isDefault,
    };
  }

  /**
   * Get user's payment methods
   */
  @Get('methods')
  @UseGuards(JwtAuthGuard)
  async getUserPaymentMethods(@CurrentUser() user: User) {
    const methods = await this.paymentService.getUserPaymentMethods(user.id);

    return {
      methods: methods.map((m) => ({
        id: m.id,
        gateway: m.gateway,
        last4: m.last4,
        cardType: m.cardType,
        expiryMonth: m.expiryMonth,
        expiryYear: m.expiryYear,
        isDefault: m.isDefault,
        createdAt: m.createdAt,
      })),
    };
  }

  /**
   * Delete payment method
   */
  @Delete('methods/:methodId')
  @UseGuards(JwtAuthGuard)
  async deletePaymentMethod(
    @CurrentUser() user: User,
    @Param('methodId') methodId: number,
  ) {
    await this.paymentService.deletePaymentMethod(user.id, methodId);

    return {
      success: true,
      message: 'Payment method deleted',
    };
  }
}
