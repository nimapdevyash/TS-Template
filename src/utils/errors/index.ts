import { StatusCodes } from 'http-status-codes';
import { AppError } from './appError.js';

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

// 422 - Unprocessable Entity
export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable entity') {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY);
  }
}

// 429 - To Many Requests
export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, StatusCodes.TOO_MANY_REQUESTS);
  }
}
