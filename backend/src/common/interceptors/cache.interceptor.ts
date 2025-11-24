import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '@nestjs/cache-manager';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class CustomCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CustomCacheInterceptor.name);

  constructor(
    private reflector: Reflector,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );
    const ttl = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    ) || 3600;

    if (!cacheKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || 'anonymous';
    const fullCacheKey = `${cacheKey}:${userId}:${JSON.stringify(request.query)}`;

    try {
      // Try to get from cache
      const cachedData = await this.redis.get(fullCacheKey);

      if (cachedData) {
        this.logger.debug(`Cache hit for key: ${fullCacheKey}`);
        return of(JSON.parse(cachedData));
      }

      this.logger.debug(`Cache miss for key: ${fullCacheKey}`);

      // If not in cache, execute the request and cache the result
      return next.handle().pipe(
        tap(async (data) => {
          try {
            await this.redis.setex(fullCacheKey, ttl, JSON.stringify(data));
            this.logger.debug(`Cached data for key: ${fullCacheKey}`);
          } catch (error) {
            this.logger.error(`Failed to cache data: ${error.message}`);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache error: ${error.message}`);
      return next.handle();
    }
  }
}
