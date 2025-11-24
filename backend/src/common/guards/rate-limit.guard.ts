import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

export const RATE_LIMIT_KEY = 'rate_limit';

interface RateLimitOptions {
  points: number; // Number of requests
  duration: number; // Time window in seconds
  blockDuration?: number; // Block duration in seconds after limit exceeded
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private reflector: Reflector,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const key = this.getKey(request);

    try {
      const current = await this.redis.incr(key);

      if (current === 1) {
        await this.redis.expire(key, rateLimitOptions.duration);
      }

      if (current > rateLimitOptions.points) {
        const ttl = await this.redis.ttl(key);

        this.logger.warn(
          `Rate limit exceeded for ${key}: ${current}/${rateLimitOptions.points} requests`,
        );

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Rate limit exceeded',
            retryAfter: ttl,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Add rate limit headers
      const response = context.switchToHttp().getResponse();
      response.setHeader('X-RateLimit-Limit', rateLimitOptions.points);
      response.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimitOptions.points - current));
      response.setHeader('X-RateLimit-Reset', await this.redis.ttl(key));

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Rate limit check failed: ${error.message}`);
      return true; // Fail open
    }
  }

  private getKey(request: any): string {
    const userId = request.user?.id || request.ip;
    const route = `${request.method}:${request.route?.path || request.url}`;
    return `rate_limit:${route}:${userId}`;
  }
}

/**
 * Decorator to apply rate limiting to a route
 * @param points Number of requests allowed
 * @param duration Time window in seconds
 * @param blockDuration Optional block duration after limit exceeded
 */
export const RateLimit = (points: number, duration: number, blockDuration?: number) => {
  return SetMetadata(RATE_LIMIT_KEY, { points, duration, blockDuration });
};

function SetMetadata(key: string, value: any) {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(key, value, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(key, value, target);
    return target;
  };
}
