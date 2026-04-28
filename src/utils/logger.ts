import { pinoInstance } from '@/configs/logger.js';
import type { ErrorLogParams, LogParams } from './interfaces/logger.js';

export class Logger {
  static info({ message, context }: LogParams): void {
    pinoInstance.info(context ?? {}, message);
  }

  static warn({ message, context }: LogParams): void {
    pinoInstance.warn(context ?? {}, message);
  }

  static debug({ message, context }: LogParams): void {
    pinoInstance.debug(context ?? {}, message);
  }

  static error({ message, err, context }: ErrorLogParams): void {
    pinoInstance.error(
      {
        ...context,
        ...(err !== undefined && {
          err:
            err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err,
        }),
      },
      message,
    );
  }

  static fatal({ message, err, context }: ErrorLogParams): void {
    pinoInstance.fatal(
      {
        ...context,
        ...(err !== undefined && {
          err:
            err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err,
        }),
      },
      message,
    );
    pinoInstance.flush?.();
  }
}
