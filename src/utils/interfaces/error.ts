import type z from 'zod';
import type { AppError } from '../errors/appError.js';

export interface GuardArgs {
  condition: boolean;
  message: string;
}

export interface ExistsArgs<T> {
  value: T | null | undefined;
  message: string;
}

export interface ErrorExtras {
  errors?: ReturnType<typeof z.treeifyError>;
}

export interface NormalisedError {
  appError: AppError;
  extras: ErrorExtras;
  originalErr: unknown;
}
