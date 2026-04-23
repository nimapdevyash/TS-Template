import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();

  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  next();
};
