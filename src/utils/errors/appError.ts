/**
 * Base class for all operational application errors.
 *
 * - 4xx errors are classified as `'fail'`  (client's fault, expected)
 * - 5xx errors are classified as `'error'` (server's fault, unexpected)
 *
 * `isOperational = true` means the message is safe to forward to the client.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly status: 'fail' | 'error';

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    // Correctly capturing the stack trace, excluding the constructor from the trace
    Error.captureStackTrace(this, this.constructor);

    /**
     * NOTE: Set the prototype explicitly.
     * This is a known TypeScript quirk when extending built-in classes
     * like Error, Array, or Map in certain build targets.
     */
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
