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

  // Example of a required variable (Will throw error if missing)
  // DATABASE_URL: z.string().url(),
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
