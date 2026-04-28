import express, { type Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rootRouter from './routes/index.js';
import { globalErrorHandler } from './middlewares/globalErrorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { httpLogger } from './middlewares/httpLogger.js';
import { env } from './configs/env.js';
import { requestIdMiddleware } from './middlewares/requestId.js';

const app: Application = express();

// Stamp x-request-id first so every downstream middleware and log line can reference it
app.use(requestIdMiddleware);

// HTTP req/res logger — must come after requestId so the ID is always present in logs
app.use(httpLogger);

// Security headers (CSP, HSTS, X-Frame-Options etc.) — tighten cors origin before production
app.use(helmet());
app.use(cors());

// Gzip/Brotli compression for all responses
app.use(compression());

// Body parsers — 10kb hard limit on both to prevent payload attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Routes
app.use(`/api/${env.APP_VERSION}`, rootRouter);

// Converts unmatched routes into a NotFoundError and forwards to the error handler
app.use(notFound);

// Must be last — normalises all error types into a consistent JSON response
app.use(globalErrorHandler);

export default app;
