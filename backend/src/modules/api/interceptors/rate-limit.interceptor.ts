import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private rateLimits: Map<string, RateLimitEntry> = new Map();

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Use API key or IP as identifier
    const identifier = request.organization?.apiKey || request.ip;

    const now = Date.now();
    const key = `${identifier}:${context.getHandler().name}`;

    let entry = this.rateLimits.get(key);

    // Clean up if reset time has passed
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + rateLimitOptions.duration * 1000,
      };
    }

    // Increment count
    entry.count += 1;
    this.rateLimits.set(key, entry);

    // Add rate limit headers
    response.setHeader('X-RateLimit-Limit', rateLimitOptions.points);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimitOptions.points - entry.count));
    response.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    // Check if limit exceeded
    if (entry.count > rateLimitOptions.points) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle();
  }
}
