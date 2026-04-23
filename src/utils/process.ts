import { logger } from './logger.js';
import type { ClosableServer } from './interfaces/closableServer.js';

/**
 * Handles system-level signals and unexpected crashes.
 * @param server - Any server instance (Express, HTTP, WebSocket) that needs to close gracefully.
 */
export const setupProcessHandler = (server?: ClosableServer) => {
  process.on('uncaughtException', (error) => {
    logger.fatal(error, 'UNCAUGHT EXCEPTION! 💥');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'UNHANDLED REJECTION! 💥');
    process.exit(1);
  });

  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

  signals.forEach((signal) => {
    process.on(signal, () => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      // Set a forced timeout just in case close() hangs
      const forceExitTimeout = setTimeout(() => {
        logger.error('Graceful shutdown timed out. Forcefully exiting.');
        process.exit(1);
      }, 10000);

      if (server) {
        server.close((err) => {
          clearTimeout(forceExitTimeout); // Clean up the timer
          if (err) {
            logger.error(err, 'Error during server close');
            process.exit(1);
          }
          logger.info('Server closed successfully.');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  });
};
