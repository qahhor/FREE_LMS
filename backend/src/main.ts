import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  // Security
  app.use(helmet());

  // Compression with optimized settings
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024, // Only compress responses larger than 1KB
    level: 6, // Compression level (0-9, 6 is balanced)
  }));

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:4200'),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('LMS API')
    .setDescription('Learning Management System API Documentation - Full-featured LMS with monetization and enterprise features')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('courses', 'Course management')
    .addTag('enrollments', 'Course enrollments')
    .addTag('lessons', 'Lesson management')
    .addTag('progress', 'User progress tracking')
    .addTag('gamification', 'Gamification features')
    .addTag('analytics', 'Analytics and reporting')
    .addTag('video', 'Video processing')
    .addTag('quiz', 'Quizzes and assessments')
    .addTag('certificates', 'Certificate generation')
    .addTag('email', 'Email notifications')
    .addTag('community', 'Forums and discussions')
    .addTag('payments', 'Payment processing')
    .addTag('subscriptions', 'Subscription management')
    .addTag('organizations', 'Multi-tenancy organizations')
    .addTag('scorm', 'SCORM content')
    .addTag('webinars', 'Live webinars')
    .addTag('api', 'API key management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  await app.listen(port);

  console.log(`
    ╔═══════════════════════════════════════════╗
    ║   LMS Backend Server Started              ║
    ║                                           ║
    ║   🚀 Server: http://localhost:${port}       ║
    ║   📚 API Docs: http://localhost:${port}/api/docs ║
    ║   📊 Environment: ${process.env.NODE_ENV || 'development'}      ║
    ║   ⚡ Performance: Optimized               ║
    ╚═══════════════════════════════════════════╝
  `);
}

bootstrap();
