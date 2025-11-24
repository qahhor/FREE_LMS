import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Entities
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';

// Controllers
import { ApiController } from './controllers/api.controller';

// Guards & Interceptors
import { ApiKeyGuard } from './guards/api-key.guard';
import { RateLimitInterceptor } from './interceptors/rate-limit.interceptor';

// Import other modules
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, User, Enrollment]),
    OrganizationsModule,
  ],
  controllers: [ApiController],
  providers: [
    ApiKeyGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
  ],
  exports: [ApiKeyGuard],
})
export class ApiModule {}
