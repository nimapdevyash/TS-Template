import pino from 'pino';
import { isProduction } from './constants/app.js';

// Use the transport helper to get the correct type
const transport = isProduction
  ? undefined // In prod, we usually log raw JSON to stdout for Loki
  : pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    });

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
  },
  transport,
);
