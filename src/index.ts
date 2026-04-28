// Side-effect: Initialises the MongoDB connection on startup
import '@/configs/db.js';

import app from './app.js';
import { createServer } from 'node:http';
import { env } from './configs/env.js';
import { Logger } from './utils/logger.js';
import { setupProcessHandler } from '@/utils/process.js';

const server = createServer(app);

// Register SIGINT, SIGTERM, uncaughtException and unhandledRejection handlers immediately
// so no crash window exists between server creation and listen()
setupProcessHandler(server);

// Slightly above typical load balancer idle timeout (60s) to prevent premature socket closure
server.keepAliveTimeout = 65000;

// Must always be higher than keepAliveTimeout to avoid a race between header parsing and socket reuse
server.headersTimeout = 66000;

server.listen(env.PORT, () => {
  Logger.info({
    message: `🚀 Server is running at ${env.HOST}:${env.PORT}/api/${env.APP_VERSION}`,
  });
});
