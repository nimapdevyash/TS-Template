import type { Request, Response, NextFunction } from 'express';
import { z, ZodObject, ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export const validate =
  (schema: ZodObject<any, any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Using Zod v4's recommended flattening utility
        const formattedErrors = z.flattenError(error);

        logger.warn(
          {
            requestId: req.headers['x-request-id'],
            errors: formattedErrors.fieldErrors,
          },
          'Validation Failed',
        );

        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: formattedErrors.fieldErrors, // Returns { fieldName: [messages] }
        });
      }
      return next(error);
    }
  };
