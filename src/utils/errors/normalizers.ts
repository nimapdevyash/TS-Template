import { StatusCodes } from 'http-status-codes';
import { ZodError, z } from 'zod';
import { Error as MongooseError } from 'mongoose';
import { AppError } from '@/utils/errors/appError.js';
import type { ErrorTag } from '../types/error.js';
import type { NormalisedError } from '../interfaces/error.js';

export const normalizers: Record<ErrorTag, (err: unknown) => NormalisedError> = {
  APP_ERROR: (err) => ({
    appError: err as AppError,
    extras: {},
    originalErr: err,
  }),

  ZOD_ERROR: (err) => {
    const zodErr = err as ZodError;
    return {
      appError: new AppError('Validation failed', StatusCodes.BAD_REQUEST),
      extras: { errors: z.treeifyError(zodErr) },
      originalErr: zodErr,
    };
  },

  MONGOOSE_CAST: (err) => {
    const castErr = err as MongooseError.CastError;
    return {
      appError: new AppError(`Invalid value for field '${castErr.path}'`, StatusCodes.BAD_REQUEST),
      extras: {},
      originalErr: castErr,
    };
  },

  MONGOOSE_VALIDATION: (err) => {
    const validationErr = err as MongooseError.ValidationError;
    const message = Object.values(validationErr.errors)
      .map((e) => e.message)
      .join(', ');
    return {
      appError: new AppError(message, StatusCodes.UNPROCESSABLE_ENTITY),
      extras: {},
      originalErr: validationErr,
    };
  },

  MONGO_DUPLICATE: (err) => {
    const dupErr = err as Error & { keyValue?: Record<string, unknown> };
    const field = dupErr.keyValue ? Object.keys(dupErr.keyValue)[0] : 'field';
    return {
      appError: new AppError(`'${field}' already exists`, StatusCodes.CONFLICT),
      extras: {},
      originalErr: dupErr,
    };
  },

  UNKNOWN: (err) => ({
    appError: new AppError('Something went very wrong!', StatusCodes.INTERNAL_SERVER_ERROR, false),
    extras: {},
    originalErr: err,
  }),
};
