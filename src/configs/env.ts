import { z as zod } from 'zod';
import * as dotenv from 'dotenv';
import { environment } from '@/utils/enums/common.js';
import { log_levels } from '@/utils/enums/pino.js';

dotenv.config();

const envSchema = zod.object({
  NODE_ENV: zod
    .enum(Object.values(environment))
    .default(environment.development),
  PORT: zod.coerce.number().default(8080),
  LOG_LEVEL: zod.enum(Object.values(log_levels)).default(log_levels.info),
  MONGO_URI: zod.string(),
  DB_MAX_RETRIES: zod.coerce.number().default(5),
  DB_RETRY_INTERVAL: zod.coerce.number().default(5000),
  HOST: zod.string().default('http://localhost'),
  APP_VERSION: zod.coerce.number().default(1),
  REDIS_HOST: zod.string(),
  REDIS_PORT: zod.coerce.number().default(6379),
  REDIS_PASSWORD: zod.string(),
  REDIS_RETRY_DELAY_MS: zod.coerce.number().default(5000),
  REDIS_RETRY_ATTEMPTS: zod.coerce.number().default(50),
  REDIS_DEFAULT_TTL: zod.coerce.number().default(86400), // 1 day
});

// Safe parse returns a result object rather than throwing immediately
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  // We use console.error here because the logger might not even be ready
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(_env.error.format(), null, 2),
  );
  process.exit(1);
}

export const env = _env.data;
