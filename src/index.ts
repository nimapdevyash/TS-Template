import '@/configs/db.js';
import app from './app.js';
import { createServer } from 'node:http';
import { env } from './configs/env.js';
import { logger } from './utils/logger.js';
import { setupProcessHandler } from '@/utils/process.js';

const server = createServer(app);

// This sets up SIGINT, SIGTERM, and Crash listeners immediately.
setupProcessHandler(server);

// NOTE: Prevents "Slowloris" attacks and hanging sockets.
server.keepAliveTimeout = 65000; // Slightly higher than Load Balancer idle timeout
server.headersTimeout = 66000;

server.listen(env.PORT, () => {
  logger.info(`🚀 Server is humming at ${env.HOST}/:${env.PORT}`);
});
