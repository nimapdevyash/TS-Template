import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Logger } from '../utils/logger.js';
import type { RequestSchema } from '@/utils/types/validate.js';
import type { ValidatedRequest } from '@/utils/interfaces/validate.js';

/**
 * Middleware factory that validates an incoming Express request against a Zod schema.
 *
 * Validates `req.body`, `req.query`, and `req.params` in a single pass. On success,
 * the parsed and coerced data is attached to `req.parsed` for type-safe access in
 * downstream handlers. On failure, a structured 400 response is returned and the
 * request is not forwarded.
 *
 * @param schema - A Zod object schema with optional `body`, `query`, and `params` keys.
 * @returns An async Express middleware function.
 *
 * @example
 * // Define your schema
 * const createUserSchema = z.object({
 *   body: z.object({
 *     name: z.string().min(1),
 *     email: z.string().email(),
 *   }),
 *   query: z.object({
 *     role: z.enum(['admin', 'user']).optional(),
 *   }),
 * });
 *
 * // Attach to a route
 * router.post(
 *   '/users',
 *   validate(createUserSchema),
 *   (req: ValidatedRequest<typeof createUserSchema>, res) => {
 *     const { name, email } = req.parsed.body;   // fully typed, no casting needed
 *     const { role } = req.parsed.query;
 *   },
 * );
 *
 * // On validation failure the middleware responds with:
 * // HTTP 400
 * // {
 * //   "status": "error",
 * //   "message": "Validation failed",
 * //   "errors": {
 * //     "fields": { "body.email": ["Invalid email"] }
 * //   }
 * // }
 */
export const validate =
  <S extends RequestSchema>(schema: S) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await schema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (result.success) {
      (req as unknown as ValidatedRequest<S>).parsed = result.data;
      return next();
    }

    const { fieldErrors, formErrors } = z.flattenError(result.error);

    Logger.warn({
      context: {
        requestId: req.headers['x-request-id'],
        method: req.method,
        path: req.path,
        fieldErrors,
        formErrors,
      },
      message: 'Request validation failed',
    });

    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: {
        ...(Object.keys(fieldErrors).length > 0 && { fields: fieldErrors }),
        ...(formErrors.length > 0 && { form: formErrors }),
      },
    });
  };
