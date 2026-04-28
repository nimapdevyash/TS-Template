export interface LogParams {
  message: string;
  context?: Record<string, unknown>; // ← was: object
}

export interface ErrorLogParams {
  message: string;
  err?: unknown;
  context?: Record<string, unknown>; // ← was: object
}
