import models from '@/models/index.js';
import { type ModelName } from '@/utils/modelNames.js';
import {
  type Model,
  type UpdateQuery,
  type ClientSession,
  type PopulateOptions,
} from 'mongoose';

type Condition = Record<string, any>;

type QueryOptions<T> = {
  condition?: Condition;
  select?: string | string[];
  populate?: PopulateOptions | PopulateOptions[];
  lean?: boolean;
};

type UpdateOptions = {
  multi?: boolean;
  new?: boolean;
  upsert?: boolean;
};

export const dbOperations = {
  /**
   * Resolve a model by name
   */
  getModel: <T = any>(name: ModelName): Model<any> => {
    const model = models[name];
    if (!model) {
      throw new Error(`Model "${name}" not found in registry.`);
    }
    return model as Model<any>;
  },

  /**
   * Create one or many documents
   */
  create: async <T>(
    modelName: ModelName,
    body: Partial<T> | Partial<T>[],
    session: ClientSession | null = null,
  ): Promise<T | T[]> => {
    const model = dbOperations.getModel<T>(modelName);

    const docs = Array.isArray(body) ? body : [body];
    const options = session ? { session } : undefined;

    const result = await model.create(docs as any, options);

    return Array.isArray(body) ? (result as T[]) : (result[0] as T);
  },

  /**
   * Find a single record
   * Lean enabled by default
   */
  findOne: async <T>(
    modelName: ModelName,
    options: QueryOptions<T> = {},
  ): Promise<T | null> => {
    const model = dbOperations.getModel<T>(modelName);

    const { condition = {}, select, populate, lean = true } = options;

    let query = model.findOne(condition);

    if (select) {
      query = query.select(select);
    }

    if (populate) {
      query = query.populate(populate as any);
    }

    if (lean) {
      query = query.lean<T>();
    }

    return query.exec() as Promise<T | null>;
  },

  /**
   * Update one or many records
   */
  update: async <T>(
    modelName: ModelName,
    condition: Condition,
    updateData: UpdateQuery<T>,
    options: UpdateOptions = {},
    session: ClientSession | null = null,
  ): Promise<any> => {
    const model = dbOperations.getModel<T>(modelName);

    const { multi = false, new: returnNew = true, upsert = false } = options;

    const queryOptions: any = {
      new: returnNew,
      upsert,
      session: session ?? undefined,
    };

    if (multi) {
      const { new: _, ...updateManyOptions } = queryOptions;

      return model
        .updateMany(condition, updateData as any, updateManyOptions)
        .exec();
    }

    return model
      .findOneAndUpdate(condition, updateData as any, queryOptions)
      .exec();
  },
};
