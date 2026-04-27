import type { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { ZodError } from 'zod';
import { logger } from '@/utils/logger.js';
import { env } from '@/configs/env.js';
import { environment } from '@/utils/enums/common.js';
import { AppError } from '@/utils/errors/appError.js';
import type { ErrorTag } from '@/utils/types/error.js';
import { normalizers } from '@/utils/errors/normalizers.js';

// ---------------------------------------------------------------------------
// Classifier
// ---------------------------------------------------------------------------

const classify = (err: unknown): ErrorTag => {
  if (err instanceof AppError) return 'APP_ERROR';
  if (err instanceof ZodError) return 'ZOD_ERROR';
  if (err instanceof MongooseError.CastError) return 'MONGOOSE_CAST';
  if (err instanceof MongooseError.ValidationError) return 'MONGOOSE_VALIDATION';

  const isMongoDuplicate =
    err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === '11000';
  if (isMongoDuplicate) return 'MONGO_DUPLICATE';

  return 'UNKNOWN';
};

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * Express global error-handling middleware.
 * Must be registered last — after all routes and other middleware.
 *
 * Handles every known error type in the application:
 *  - `AppError` subclasses  (BadRequestError, NotFoundError, etc.)
 *  - `ZodError`             (validation — includes full field tree in response)
 *  - `MongooseError`        (CastError, ValidationError)
 *  - MongoDB duplicate key  (code 11000)
 *  - Unknown / unexpected   (safe fallback, no internals leaked in production)
 *
 * Message visibility:
 *  - Operational errors  → real message in all environments
 *  - Non-operational     → real message in development, generic fallback in production
 *
 * @example
 * // app.ts — must come after all routes
 * app.use(globalErrorHandler);
 */
export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const isDev = env.NODE_ENV === environment.development;
  const requestId = req.headers['x-request-id'];

  const tag = classify(err);
  const { appError, extras, originalErr } = normalizers[tag](err);

  // ── Logging ──────────────────────────────────────────────────────────────
  logger.error(
    {
      err: {
        name: appError.name,
        message: appError.message,
        statusCode: appError.statusCode,
        isOperational: appError.isOperational,
        stack: isDev && originalErr instanceof Error ? originalErr.stack : undefined,
      },
      requestId,
      method: req.method,
      url: req.url,
    },
    'Error caught by global handler',
  );

  // ── Response ─────────────────────────────────────────────────────────────
  const message = appError.isOperational || isDev ? appError.message : 'Something went very wrong!';

  res.status(appError.statusCode).json({
    status: appError.status,
    message,
    requestId,
    ...extras,
  });
};
