import { type PopulateOptions, type ClientSession, type UpdateQuery } from 'mongoose';
import { type ModelName } from '@/utils/modelNames.js';

export type Condition = Record<string, unknown>;

export type QueryOptions = {
  condition?: Condition;
  select?: string | string[];
  populate?: PopulateOptions | PopulateOptions[];
  lean?: boolean;
};

export type UpdateOptions = {
  multi?: boolean;
  new?: boolean;
  upsert?: boolean;
};

export type CreateParams<T> = {
  modelName: ModelName;
  body: Partial<T> | Partial<T>[];
  session?: ClientSession | null;
};

export type FindOneParams<T> = {
  modelName: ModelName;
  options?: QueryOptions;
  session?: ClientSession | null;
};

export type UpdateParams<T> = {
  modelName: ModelName;
  condition: Condition;
  updateData: UpdateQuery<T>;
  options?: UpdateOptions;
  session?: ClientSession | null;
};

export type BaseDoc = Document & Record<string, unknown>;
