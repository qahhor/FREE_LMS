import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { Payment } from './entities/payment.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Subscription } from './entities/subscription.entity';
import { Order, OrderItem } from './entities/order.entity';

// Services
import { PaymentService } from './services/payment.service';
import { SubscriptionService } from './services/subscription.service';

// Controllers
import { PaymentController } from './controllers/payment.controller';
import { SubscriptionController } from './controllers/subscription.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      PaymentMethod,
      SubscriptionPlan,
      Subscription,
      Order,
      OrderItem,
    ]),
    ScheduleModule.forRoot(), // For cron jobs
  ],
  controllers: [PaymentController, SubscriptionController],
  providers: [PaymentService, SubscriptionService],
  exports: [PaymentService, SubscriptionService],
})
export class PaymentsModule {}
