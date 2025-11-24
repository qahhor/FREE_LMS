import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization.entity';

// Services
import { OrganizationService } from './services/organization.service';

// Controllers
import { OrganizationController } from './controllers/organization.controller';

// Import PaymentsModule for SubscriptionService
import { PaymentsModule } from '../payments/payments.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, OrganizationMember]),
    PaymentsModule,
    UsersModule,
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationsModule {}
