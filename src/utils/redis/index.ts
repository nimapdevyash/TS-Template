import { redisService } from '@/configs/redis.js';
import { logger } from '@/utils/logger.js';

export class CacheService {
  // Set a value in the cache with an optional TTL (Time To Live).
  public static async set(
    key: string,
    value: unknown,
    ttlSeconds?: number,
  ): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      if (ttlSeconds) {
        await redisService.client.set(key, stringValue, 'EX', ttlSeconds);
      } else {
        await redisService.client.set(key, stringValue);
      }
    } catch (err) {
      logger.error({ err, key }, '❌ CacheService: Failed to set key');
    }
  }

  // Get a parsed value from the cache.
  public static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisService.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      logger.error({ err, key }, '❌ CacheService: Failed to get key');
      return null;
    }
  }

  // Get data if it exists, otherwise fetch it from the DB and cache it.
  public static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 3600, // Default 1 hour
  ): Promise<T> {
    const cachedData = await this.get<T>(key);
    if (cachedData) return cachedData;

    // Cache Miss - Fetch from source
    const freshData = await fetcher();

    // Save to cache asynchronously (don't await to speed up response)
    this.set(key, freshData, ttlSeconds).catch((err) =>
      logger.error({ err, key }, '❌ CacheService: Background set failed'),
    );

    return freshData;
  }

  // Delete a key from the cache.
  public static async del(key: string): Promise<void> {
    try {
      await redisService.client.del(key);
    } catch (err) {
      logger.error({ err, key }, '❌ CacheService: Failed to delete key');
    }
  }

  /**
   * Clear multiple keys using a pattern (e.g., "user:*")
   * USE WITH CAUTION in production on large datasets.
   */
  public static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisService.client.keys(pattern);
      if (keys.length > 0) {
        await redisService.client.del(...keys);
        logger.info(
          { pattern, count: keys.length },
          '🧹 CacheService: Pattern invalidated',
        );
      }
    } catch (err) {
      logger.error(
        { err, pattern },
        '❌ CacheService: Pattern invalidation failed',
      );
    }
  }
}
