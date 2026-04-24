import express, { type Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rootRouter from './routes/index.js';
import { globalErrorHandler } from './middlewares/globalErrorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { httpLogger } from './middlewares/morgan.js';
import { env } from './configs/env.js';

const app: Application = express();

// SECURITY & PERFORMANCE MIDDLEWARE
app.use(helmet()); // Sets various HTTP headers for security
app.use(cors()); // Enable CORS - adjust origin in production
app.use(compression()); // Gzip compression
app.use(express.json({ limit: '10kb' })); // Body parser with payload limit
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Using morgan to stream logs into our custom logger
app.use(httpLogger);
app.use(`/api/${env.APP_VERSION}`, rootRouter);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
