export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly status: 'fail' | 'error';

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

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
