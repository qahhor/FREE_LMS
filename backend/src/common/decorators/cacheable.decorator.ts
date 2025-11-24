import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';

/**
 * Decorator to enable caching for a controller method
 * @param key - Cache key prefix
 * @param ttl - Time to live in seconds (default: 3600)
 */
export const Cacheable = (key: string, ttl: number = 3600) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyKey, descriptor);
    return descriptor;
  };
};

/**
 * Decorator for invalidating cache
 * @param keys - Array of cache key prefixes to invalidate
 */
export const InvalidateCache = (...keys: string[]) => {
  return SetMetadata('invalidate_cache_keys', keys);
};
