import type { Response } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import type { PaginationMeta } from './interfaces/api.js';

export class ApiResponse<T> {
  public readonly success: boolean;

  constructor(
    public readonly statusCode: number,
    public readonly data: T | null = null,
    public readonly message: string = getReasonPhrase(statusCode),
    public readonly meta?: PaginationMeta,
  ) {
    this.success = statusCode >= 200 && statusCode < 300;
  }

  // 200
  static ok<T>(res: Response, data: T, message?: string): Response {
    return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, data, message));
  }

  // 201
  static created<T>(res: Response, data: T, message?: string): Response {
    return res
      .status(StatusCodes.CREATED)
      .json(new ApiResponse(StatusCodes.CREATED, data, message));
  }

  // 204
  static noContent(res: Response, message?: string): Response {
    return res
      .status(StatusCodes.NO_CONTENT)
      .json(new ApiResponse(StatusCodes.NO_CONTENT, null, message));
  }

  // 202
  static accepted<T>(res: Response, data: T, message?: string): Response {
    return res
      .status(StatusCodes.ACCEPTED)
      .json(new ApiResponse(StatusCodes.ACCEPTED, data, message));
  }

  // 200
  static paginated<T>(
    res: Response,
    data: T[],
    meta: { total: number; page: number; limit: number; totalPages: number },
    message?: string,
  ): Response {
    const response = new ApiResponse(StatusCodes.OK, data, message, meta);
    return res.status(StatusCodes.OK).json(response);
  }
}
