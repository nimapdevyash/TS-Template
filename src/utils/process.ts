import { Logger } from './logger.js';
import type { ClosableServer } from './interfaces/closableServer.js';

/**
 * Handles system-level signals and unexpected crashes.
 * @param server - Any server instance (Express, HTTP, WebSocket) that needs to close gracefully.
 */
export const setupProcessHandler = (server?: ClosableServer) => {
  process.on('uncaughtException', (error) => {
    Logger.fatal({ err: error, message: 'UNCAUGHT EXCEPTION! 💥' });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    Logger.fatal({ err: reason, message: 'UNHANDLED REJECTION! 💥' });
    process.exit(1);
  });

  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

  signals.forEach((signal) => {
    process.on(signal, () => {
      Logger.info({ message: `${signal} received. Starting graceful shutdown...` });

      // Set a forced timeout just in case close() hangs
      const forceExitTimeout = setTimeout(() => {
        Logger.error({ message: 'Graceful shutdown timed out. Forcefully exiting.' });
        process.exit(1);
      }, 10000);

      if (server) {
        server.close((err) => {
          clearTimeout(forceExitTimeout); // Clean up the timer
          if (err) {
            Logger.error({ err, message: 'Error during server close' });
            process.exit(1);
          }
          Logger.info({ message: 'Server closed successfully.' });
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  });
};
