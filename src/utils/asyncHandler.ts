import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an asynchronous (or synchronous) controller function
 * to catch any errors and pass them to the global error handler.
 */
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    //NOTE: Wrapping in Promise.resolve handles both Sync and Async functions
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};
