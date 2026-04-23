import type { Response } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

export class ApiResponse<T = any> {
  public readonly success: boolean;

  constructor(
    public readonly statusCode: number,
    public readonly data: T | null = null,
    public readonly message: string = getReasonPhrase(statusCode),
  ) {
    this.success = statusCode >= 200 && statusCode < 300;
  }

  /**
   * 200 OK
   */
  static ok<T>(res: Response, data: T, message?: string) {
    const response = new ApiResponse(StatusCodes.OK, data, message);
    return res.status(StatusCodes.OK).json(response);
  }

  /**
   * 201 Created
   */
  static created<T>(res: Response, data: T, message?: string) {
    const response = new ApiResponse(StatusCodes.CREATED, data, message);
    return res.status(StatusCodes.CREATED).json(response);
  }

  /**
   * 204 No Content
   */
  static noContent(res: Response, message?: string) {
    const response = new ApiResponse(StatusCodes.NO_CONTENT, null, message);
    return res.status(StatusCodes.NO_CONTENT).json(response);
  }

  /**
   * 202 Accepted
   */
  static accepted<T>(res: Response, data: T, message?: string) {
    const response = new ApiResponse(StatusCodes.ACCEPTED, data, message);
    return res.status(StatusCodes.ACCEPTED).json(response);
  }
}
