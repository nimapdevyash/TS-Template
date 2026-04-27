import { StatusCodes } from 'http-status-codes';

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

// 400 - Bad Request
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request') {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

// 401 - Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

// 403 - Forbidden
export class ForbiddenError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, StatusCodes.FORBIDDEN);
  }
}

// 404 - Not Found
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, StatusCodes.NOT_FOUND);
  }
}

// 409 - Conflict
export class ConflictError extends AppError {
  constructor(message: string = 'Conflict detected') {
    super(message, StatusCodes.CONFLICT);
  }
}

// 500 - Internal Server Error
export class InternalServerError extends AppError {
  constructor(message: string = 'Something went wrong internally') {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR);
  }
}
