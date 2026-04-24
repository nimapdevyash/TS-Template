import morgan from 'morgan';
import { logger } from '../utils/logger.js';
import { env } from '../configs/env.js';

// Determine the format based on environment
const format = env.NODE_ENV === 'production' ? 'combined' : 'dev';

/**
 * Custom Morgan middleware that pipes HTTP request logs
 * into our internal Winston/Pino logger.
 */
export const httpLogger = morgan(format, {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
  // Optional: Skip logging for health check endpoints to keep logs clean
  skip: (req) => req.url === '/health',
});
