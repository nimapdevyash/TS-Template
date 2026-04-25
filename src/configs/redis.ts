import { Redis, type RedisOptions } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

class RedisService {
  private static instance: RedisService;
  private _client: Redis | null = null;
  private _connectingPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public get client(): Redis {
    if (!this._client) {
      throw new Error('Redis client not initialized. Call connect() first.');
    }
    return this._client;
  }

  public async connect(): Promise<void> {
    if (this._client) return;
    if (this._connectingPromise) return this._connectingPromise;

    this._connectingPromise = (async () => {
      try {
        const options: RedisOptions & { maxOfflineQueueSize?: number } = {
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          password: env.REDIS_PASSWORD,

          // RETRY STRATEGY (Capped for Fail-Fast)
          retryStrategy: (times: number) => {
            const maxAttempts = env.REDIS_RETRY_ATTEMPTS;
            if (times > maxAttempts) {
              logger.fatal(
                `❌ Redis: Max retries (${maxAttempts}) reached. Exiting process.`,
              );
              // Delay exit slightly to allow logs to flush
              setTimeout(() => process.exit(1), 1000);
              return null;
            }
            return Math.min(times * 100, env.REDIS_RETRY_DELAY_MS);
          },

          // RESOURCE PROTECTION
          enableOfflineQueue: true,
          maxOfflineQueueSize: 1000, // Limit memory usage during outages

          // CONNECTION TIMEOUTS
          maxRetriesPerRequest: null,
          connectTimeout: 10000, // 10s timeout for initial connection
        };

        const redis = new Redis(options);

        // Lifecycle Event Listeners
        redis.on('connect', () => logger.info('📡 Redis: Connecting...'));
        redis.on('ready', () =>
          logger.info('🚀 Redis Connected: Ready to accept commands'),
        );
        redis.on('reconnecting', (ms: number) =>
          logger.warn(`🔄 Redis: Reconnecting in ${ms}ms`),
        );

        redis.on('error', (err: Error) => {
          logger.error({ err }, '❌ Redis Error');
        });

        this._client = redis;
      } catch (error) {
        this._connectingPromise = null;
        logger.error({ error }, '❌ Redis: Critical initialization failure');
        throw error;
      }
    })();

    return this._connectingPromise;
  }

  public async disconnect(): Promise<void> {
    if (this._client) {
      await this._client.quit();
      this._client = null;
      this._connectingPromise = null;
      logger.info('🔌 Redis: Disconnected gracefully');
    }
  }
}

export const redisService = RedisService.getInstance();

// App Startup: Fail fast if the backbone (Redis) is missing
try {
  await redisService.connect();
} catch (err: unknown) {
  logger.fatal(
    { err },
    '❌ Redis: Startup connection failed. Process exiting.',
  );
  process.exit(1);
}
