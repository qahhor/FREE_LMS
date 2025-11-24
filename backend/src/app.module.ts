import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { RedisModule } from '@nestjs-modules/ioredis';
import * as redisStore from 'cache-manager-redis-store';

// Config
import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';

// Performance & Security
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { CustomCacheInterceptor } from './common/interceptors/cache.interceptor';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { VideoModule } from './modules/video/video.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { ProgressModule } from './modules/progress/progress.module';
import { CertificateModule } from './modules/certificates/certificate.module';
import { EmailModule } from './modules/email/email.module';
import { CommunityModule } from './modules/community/community.module';

// Phase 3 Modules
import { PaymentsModule } from './modules/payments/payments.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ApiModule } from './modules/api/api.module';
import { ScormModule } from './modules/scorm/scorm.module';
import { WebinarsModule } from './modules/webinars/webinars.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),

    // Redis Cache (cache-manager for simple caching)
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: redisConfig,
    }),

    // Redis (ioredis for advanced features: rate limiting, custom caching)
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        options: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
        },
      }),
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get<number>('THROTTLE_TTL', 60),
        limit: configService.get<number>('THROTTLE_LIMIT', 10),
      }),
    }),

    // Feature Modules
    EmailModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    EnrollmentsModule,
    GamificationModule,
    AnalyticsModule,
    VideoModule,
    QuizModule,
    ProgressModule,
    CertificateModule,
    CommunityModule,

    // Phase 3 Modules
    PaymentsModule,
    OrganizationsModule,
    ApiModule,
    ScormModule,
    WebinarsModule,
  ],
  providers: [
    // Global Performance Monitoring
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    // Global Caching
    {
      provide: APP_INTERCEPTOR,
      useClass: CustomCacheInterceptor,
    },
  ],
})
export class AppModule {}
