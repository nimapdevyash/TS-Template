import models from '@/models/index.js';
import {
  type CreateParams,
  type FindOneParams,
  type UpdateParams,
} from '@/utils/types/dbOperations.js';
import { type ModelName } from '@/utils/modelNames.js';
import { type Model, type ClientSession } from 'mongoose';

export const dbOperations = {
  /**
   * Retrieves a typed Mongoose model from the registry.
   */
  getModel: <T>(name: ModelName): Model<T> => {
    const model = models[name] as Model<T> | undefined;

    if (!model) {
      throw new Error(`Model "${name}" not found in registry.`);
    }

    return model;
  },

  /**
   * Create one or many documents
   */
  /**
   * Create one or many documents
   */

  // ... inside dbOperations

  create: async <T>({ modelName, body, session = null }: CreateParams<T>): Promise<T | T[]> => {
    const model = dbOperations.getModel<T>(modelName);

    // Cast session to Mongoose's expected type (ClientSession | undefined)
    const mongooseSession = (session ?? undefined) as ClientSession | undefined;

    if (Array.isArray(body)) {
      // insertMany is explicitly built for arrays and handles the types much better
      const docs = await model.insertMany(body, {
        ...(mongooseSession && { session: mongooseSession }),
      });
      return docs as unknown as T[];
    }

    // For single objects, using the constructor avoids the .create() overload mess entirely
    const doc = new model(body);

    if (mongooseSession) {
      await doc.save({ session: mongooseSession });
    } else {
      await doc.save();
    }

    // Convert to POJO (Plain Old JavaScript Object) to match your interface T
    return doc.toObject() as T;
  },

  /**
   * Find a single record
   */
  findOne: async <T>({
    modelName,
    options = {},
    session = null,
  }: FindOneParams<T>): Promise<T | null> => {
    const model = dbOperations.getModel<T>(modelName);
    const { condition = {}, select, populate, lean = true } = options;

    const query = model.findOne(condition);

    if (select) query.select(select);
    if (populate) query.populate(populate);
    if (session) query.session(session);

    // .lean<T>() ensures the return type matches your interface T
    return (lean ? query.lean<T>().exec() : query.exec()) as Promise<T | null>;
  },

  /**
   * Update one or many records
   */
  update: async <T>({
    modelName,
    condition,
    updateData,
    options = {},
    session = null,
  }: UpdateParams<T>) => {
    const model = dbOperations.getModel<T>(modelName);
    const { multi = false, new: returnNew = true, upsert = false } = options;

    const config = {
      upsert,
      new: returnNew,
      ...(session && { session }),
    };

    if (multi) {
      return model.updateMany(condition, updateData, config).exec();
    }

    return model.findOneAndUpdate(condition, updateData, config).lean<T>().exec();
  },
};
