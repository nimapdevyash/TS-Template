import pino, { type Logger } from 'pino';
import { env } from '@/configs/env.js';
import { environment } from '@/utils/enums/common.js';

/**
 * Logger Configuration Singleton
 * Handles the initialization and lifecycle of the Pino instance.
 */
class LoggerConfig {
  private static instance: Logger;

  private constructor() {}

  public static getInstance(): Logger {
    if (!LoggerConfig.instance) {
      const isDev = env.NODE_ENV === environment.development;

      LoggerConfig.instance = pino(
        {
          level: env.LOG_LEVEL || 'info',
          timestamp: pino.stdTimeFunctions.isoTime,
          formatters: {
            level: (label) => ({ level: label.toUpperCase() }),
          },
          // base labels ensure every log line is identifiable in Loki
          base: {
            service: env.APP_NAME,
            env: env.NODE_ENV,
          },
          // Redact sensitive fields before they ever reach Loki
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              '*.password',
              '*.token',
              '*.secret',
            ],
            censor: '[REDACTED]',
          },
        },
        isDev
          ? pino.transport({
              target: 'pino-pretty',
              options: {
                colorize: true,
                ignore: 'pid,hostname',
                translateTime: 'SYS:standard',
              },
            })
          : undefined, // Standard JSON to stdout for production (Loki via Alloy)
      );
    }

    return LoggerConfig.instance;
  }
}

export const pinoInstance = LoggerConfig.getInstance();
