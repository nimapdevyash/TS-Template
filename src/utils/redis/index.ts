import { redisService } from '@/configs/redis.js';
import { logger } from '@/utils/logger.js';
import type {
  CacheSetParams,
  CacheGetParams,
  CacheGetOrSetParams,
  CacheDelParams,
  CacheInvalidatePatternParams,
} from '@/utils/interfaces/redis.js';
import { env } from '@/configs/env.js';

export class CacheService {
  private static fetcherPromises = new Map<string, Promise<unknown>>();

  // Serializes and stores a value in Redis with an optional expiration time.
  public static async set({
    key,
    value,
    ttlSeconds = env.REDIS_DEFAULT_TTL,
  }: CacheSetParams): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await redisService.client.set(key, stringValue, 'EX', ttlSeconds);
    } catch (err) {
      logger.error({ err, key }, '❌ CacheService: Failed to set key');
    }
  }

  // Retrieves a value from Redis and parses it back into its original type.
  public static async get<T>({ key }: CacheGetParams): Promise<T | null> {
    try {
      const data = await redisService.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      logger.error({ err, key }, '❌ CacheService: Failed to get key');
      return null;
    }
  }

  // Checks cache for data, otherwise executes the fetcher and caches the result while preventing request overlap.
  public static async getOrSet<T>({
    key,
    fetcher,
    ttlSeconds = 3600,
  }: CacheGetOrSetParams<T>): Promise<T> {
    const cachedData = await this.get<T>({ key });
    if (cachedData) return cachedData;

    const existingPromise = this.fetcherPromises.get(key);
    if (existingPromise) return existingPromise as Promise<T>;

    const fetchPromise = fetcher().finally(() => {
      this.fetcherPromises.delete(key);
    });

    this.fetcherPromises.set(key, fetchPromise);
    const freshData = await fetchPromise;

    this.set({ key, value: freshData, ttlSeconds }).catch((err) =>
      logger.error({ err, key }, '❌ CacheService: Background set failed'),
    );

    return freshData;
  }

  // Removes a specific key and its associated data from the Redis store.
  public static async del({ key }: CacheDelParams): Promise<void> {
    try {
      await redisService.client.del(key);
    } catch (err) {
      logger.error({ err, key }, '❌ CacheService: Failed to delete key');
    }
  }

  // Iteratively finds and deletes all keys matching a pattern without blocking the Redis server.
  public static async invalidatePattern({
    pattern,
  }: CacheInvalidatePatternParams): Promise<void> {
    try {
      let cursor = '0';
      let totalDeleted = 0;

      do {
        const [nextCursor, keys] = await redisService.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          await redisService.client.del(...keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== '0');

      if (totalDeleted > 0) {
        logger.info(
          { pattern, count: totalDeleted },
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
