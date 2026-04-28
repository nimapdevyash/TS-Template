import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { REQUEST_ID_HEADER } from '@/utils/constants/app.js';

/**
 * Ensures every inbound request has a unique x-request-id header.
 *
 * - Forwards the caller's ID if they sent one (useful for distributed tracing).
 * - Generates a fresh UUID v4 otherwise.
 * - Echoes the ID back in the response so clients can correlate logs.
 *
 * Mount BEFORE pinoMiddleware so pino picks up the header automatically.
 */
export function assignId(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers[REQUEST_ID_HEADER];
  // Guarantee a string at every branch
  const requestId: string = Array.isArray(existingId)
    ? (existingId[0] ?? randomUUID()) // array[0] could be undefined too
    : (existingId ?? randomUUID());

  req.headers[REQUEST_ID_HEADER] = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}
