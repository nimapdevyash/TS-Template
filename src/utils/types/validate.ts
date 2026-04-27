import type { z, ZodObject } from 'zod';

export type RequestSchema = ZodObject<{
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}>;

export type ParsedRequest<S extends RequestSchema> = z.infer<S>;
