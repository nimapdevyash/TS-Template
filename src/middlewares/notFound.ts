import type { Request, Response } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Middleware to handle 404 - Not Found errors.
 * This should be placed after all valid route definitions.
 */
export const notFound = (req: Request, res: Response): void => {
  const message = `Route ${req.originalUrl} not found`;

  logger.warn(
    {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    },
    message,
  );

  res.status(404).json({
    success: false,
    message,
  });
};
