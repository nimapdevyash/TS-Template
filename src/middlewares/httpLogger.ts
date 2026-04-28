import { pinoHttp } from 'pino-http';
import { pinoInstance } from '@/configs/logger.js';
import { env } from '@/configs/env.js';
import { environment } from '@/utils/enums/common.js';
import { REQUEST_ID_HEADER } from '@/utils/constants/app.js';

/**
 * HTTP request/response logger.
 *
 * Mounts AFTER requestIdMiddleware so `x-request-id` is always present.
 * Logs are structured JSON in production — Alloy ships them to Loki.
 *
 * Loki labels (low-cardinality only — never put requestId in a label):
 *   service, env, context="http"
 *
 * High-cardinality fields (requestId, userId, etc.) go in the log line body
 * where Loki's LogQL can still query them with `|= "abc-123"`.
 */
export const httpLogger = pinoHttp({
  logger: pinoInstance,

  // Re-use the ID stamped by requestIdMiddleware
  genReqId: (req) => req.headers[REQUEST_ID_HEADER] ?? 'unknown',

  // Structured fields added to every HTTP log line
  customProps: (req) => ({
    context: 'http',
    requestId: req.headers[REQUEST_ID_HEADER],
  }),

  // Map HTTP status codes → pino log levels for Grafana alerting
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  // Custom success/error messages so Loki text search is predictable
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} ${res.statusCode} — ${err.message}`,

  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      // headers intentionally omitted — keeps logs clean and avoids leaking tokens
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: (err) => ({
      type: err.type,
      message: err.message,
      stack: env.NODE_ENV === environment.development ? err.stack : undefined,
    }),
  },

  // Suppress health-check noise so Loki doesn't store thousands of /health lines
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/ready',
  },
});
