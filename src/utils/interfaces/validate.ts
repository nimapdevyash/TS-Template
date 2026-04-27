import type { Request } from 'express';
import type { RequestSchema, ParsedRequest } from '@/utils/types/validate.js';

export interface ValidatedRequest<S extends RequestSchema> extends Request {
  parsed: ParsedRequest<S>;
}
