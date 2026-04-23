import { StatusCodes } from 'http-status-codes';
import type { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger.js';
import { env } from '@/configs/env.js';
import { ZodError } from 'zod';
import { environment } from '@/utils/enums/common.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const requestId = req.headers['x-request-id'];

  // Log everything for the devs
  logger.error(
    {
      err: {
        message: err.message,
        stack: env.NODE_ENV === environment.development ? err.stack : undefined,
        name: err.name,
      },
      requestId,
      method: req.method,
      url: req.url,
    },
    'Error caught by global handler',
  );

  // Handle specific known errors
  if (err instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: 'error',
      message: 'Validation Error',
      errors: err.flatten().fieldErrors,
      requestId,
    });
  }

  // Send standardized response
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message =
    err.isOperational || env.NODE_ENV === 'development'
      ? err.message
      : 'Something went very wrong!';

  return res.status(statusCode).json({
    status: 'error',
    message,
    requestId,
  });
};
