import models from '@/models/index.js';
import { type ModelName } from '@/utils/modelNames.js';
import {
  type AggregateParams,
  type BulkWriteParams,
  type CountParams,
  type CreateParams,
  type DeleteParams,
  type ExistsParams,
  type FindByIdParams,
  type FindManyParams,
  type FindOneParams,
  type FindOrCreateParams,
  type RestoreParams,
  type UpdateByIdParams,
  type UpdateParams,
} from '@/utils/types/dbOperations.js';
import { type ClientSession, type Model } from 'mongoose';

/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * ─────────────────────────────────────────────────────────── Private Helpers ─────────────────────────────────────────────────────────────
 * ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 */

/**
 * Retrieves a typed Mongoose model from the registry.
 * Throws a descriptive error if the model is not registered.
 */
const getModel = <T>(name: ModelName): Model<T> => {
  const model = models[name] as Model<T> | undefined;
  if (!model) {
    throw new Error(`Model "${name}" not found in registry.`);
  }
  return model;
};

/**
 * Normalises a nullable session to the type Mongoose expects.
 */
const toSession = (session: ClientSession | null | undefined): ClientSession | undefined =>
  session ?? undefined;

// ─── DbOperations Class ───────────────────────────────────────────────────────

export class DbOperations {
  private constructor() {
    // Utility class — instantiation is not allowed.
  }

  /* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   * ──────────────────────────────────────────────────────────────── Create ─────────────────────────────────────────────────────────────────
   * ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   */

  /**
   * Creates one or many documents.
   * - Arrays  → `insertMany` (atomic, ordered by default)
   * - Singles → `new Model + save` (runs all middleware & validators)
   */
  static async create<T>({ modelName, body, session = null }: CreateParams<T>): Promise<T | T[]> {
    const model = getModel<T>(modelName);
    const mongooseSession = toSession(session);

    if (Array.isArray(body)) {
      const docs = await model.insertMany(body, {
        ...(mongooseSession && { session: mongooseSession }),
      });
      return docs as unknown as T[];
    }

    const doc = new model(body);
    await doc.save({ ...(mongooseSession && { session: mongooseSession }) });
    return doc.toObject() as T;
  }

  /* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   * ──────────────────────────────────────────────────────────────── Read ───────────────────────────────────────────────────────────────────
   * ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   */

  /**
   * Finds a single document matching the given condition.
   * Returns `null` when not found.
   */
  static async findOne<T>({
    modelName,
    options = {},
    session = null,
  }: FindOneParams<T>): Promise<T | null> {
    const model = getModel<T>(modelName);
    const { condition = {}, select, populate, sort, lean = true } = options;

    const query = model.findOne(condition);

    if (select) query.select(select);
    if (populate) query.populate(populate);
    if (sort) query.sort(sort);
    if (session) query.session(session);

    return (lean ? query.lean<T>().exec() : query.exec()) as Promise<T | null>;
  }

  /**
   * Finds a document by its `_id`.
   * Uses model.findById directly to avoid FilterQuery/WithId type conflicts
   * that arise when manually spreading `{ _id: id }` into a FilterQuery<T>.
   */
  static async findById<T>({
    modelName,
    id,
    options = {},
    session = null,
  }: FindByIdParams<T>): Promise<T | null> {
    const model = getModel<T>(modelName);
    const { select, populate, sort, lean = true } = options;

    const query = model.findById(id);

    if (select) query.select(select);
    if (populate) query.populate(populate);
    if (sort) query.sort(sort);
    if (session) query.session(session);

    return (lean ? query.lean<T>().exec() : query.exec()) as Promise<T | null>;
  }

  /**
   * Finds all documents matching the given condition.
   * Supports pagination via `limit` and `skip`.
   */
  static async findMany<T>({
    modelName,
    options = {},
    session = null,
  }: FindManyParams<T>): Promise<T[]> {
    const model = getModel<T>(modelName);
    const { condition = {}, select, populate, sort, lean = true, limit, skip } = options;

    const query = model.find(condition);

    if (select) query.select(select);
    if (populate) query.populate(populate);
    if (sort) query.sort(sort);
    if (limit !== undefined) query.limit(limit);
    if (skip !== undefined) query.skip(skip);
    if (session) query.session(session);

    return (lean ? query.lean<T>().exec() : query.exec()) as Promise<T[]>;
  }

  /* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   * ──────────────────────────────────────────────────────────────── Update ─────────────────────────────────────────────────────────────────
   * ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   */

  /**
   * Updates one or many documents.
   * - `multi: true`  → `updateMany` (returns update result, not document)
   * - `multi: false` → `findOneAndUpdate` (returns the updated document)
   */
  static async update<T>({
    modelName,
    condition,
    updateData,
    options = {},
    session = null,
  }: UpdateParams<T>) {
    const model = getModel<T>(modelName);
    const { multi = false, returnNew = true, upsert = false } = options;

    const config = {
      upsert,
      new: returnNew,
      runValidators: true,
      ...(session && { session }),
    };

    if (multi) {
      return model.updateMany(condition, updateData, config).exec();
    }

    return model.findOneAndUpdate(condition, updateData, config).lean<T>().exec();
  }

  /**
   * Finds a document by `_id` and updates it.
   * Uses model.findByIdAndUpdate directly — avoids FilterQuery/WithId conflicts.
   * `multi` is intentionally excluded since updating many by a single _id is nonsensical.
   */
  static async updateById<T>({
    modelName,
    id,
    updateData,
    options = {},
    session = null,
  }: UpdateByIdParams<T>) {
    const model = getModel<T>(modelName);
    const { returnNew = true, upsert = false } = options;

    return model
      .findByIdAndUpdate(id, updateData, {
        upsert,
        new: returnNew,
        runValidators: true,
        ...(session && { session }),
      })
      .lean<T>()
      .exec();
  }

  /* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   * ──────────────────────────────────────────────────────────────── Delete ─────────────────────────────────────────────────────────────────
   * ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   */

  /**
   * Deletes one document matching the condition.
   *
   * - `hardDelete: false` (default) → soft delete: sets `deletedAt` to now.
   *   Requires your schema to have a `deletedAt: Date | null` field.
   * - `hardDelete: true` → permanently removes the document.
   */
  static async deleteOne<T>({
    modelName,
    condition,
    session = null,
    hardDelete = false,
  }: DeleteParams<T>) {
    const model = getModel<T>(modelName);
    const sessionOpt = session ? { session } : {};

    if (hardDelete) {
      return model.deleteOne(condition, sessionOpt).exec();
    }

    return model
      .findOneAndUpdate(
        condition,
        { $set: { deletedAt: new Date() } },
        { new: true, ...sessionOpt },
      )
      .lean<T>()
      .exec();
  }

  /**
   * Deletes many documents matching the condition.
   *
   * - `hardDelete: false` (default) → soft delete: sets `deletedAt` to now.
   * - `hardDelete: true` → permanently removes all matching documents.
   */
  static async deleteMany<T>({
    modelName,
    condition,
    session = null,
    hardDelete = false,
  }: DeleteParams<T>) {
    const model = getModel<T>(modelName);
    const sessionOpt = session ? { session } : {};

    if (hardDelete) {
      return model.deleteMany(condition, sessionOpt).exec();
    }

    return model
      .updateMany(
        condition,
        { $set: { deletedAt: new Date() } },
        { runValidators: true, ...sessionOpt },
      )
      .exec();
  }

  /**
   * Restores a soft-deleted document by clearing its `deletedAt` field.
   */
  static async restore<T>({ modelName, condition, session = null }: RestoreParams<T>) {
    const model = getModel<T>(modelName);
    const sessionOpt = session ? { session } : {};

    return model
      .findOneAndUpdate(
        condition,
        { $unset: { deletedAt: '' } },
        { new: true, runValidators: true, ...sessionOpt },
      )
      .lean<T>()
      .exec();
  }

  /* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   * ───────────────────────────────────────────────────────── Existence & Count ─────────────────────────────────────────────────────────────
   * ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   */

  /**
   * Returns `true` if at least one document matches the condition.
   * Uses Mongoose's `exists()` — more efficient than a full `findOne`.
   */
  static async exists<T>({
    modelName,
    condition,
    session = null,
  }: ExistsParams<T>): Promise<boolean> {
    const model = getModel<T>(modelName);
    const query = model.exists(condition);
    if (session) query.session(session);
    const result = await query.exec();
    return result !== null;
  }

  /**
   * Returns the number of documents matching the condition.
   * Uses `countDocuments` (honors filters) rather than the deprecated `count`.
   */
  static async count<T>({
    modelName,
    condition = {},
    session = null,
  }: CountParams<T>): Promise<number> {
    const model = getModel<T>(modelName);
    const query = model.countDocuments(condition);
    if (session) query.session(session);
    return query.exec();
  }

  /* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   * ────────────────────────────────────────────────────────────── Advanced ─────────────────────────────────────────────────────────────────
   * ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   */

  /**
   * Runs an aggregation pipeline against the collection.
   * `pipeline` must be typed as `PipelineStage[]` — Mongoose's aggregate()
   * overloads reject loose `Record<string, unknown>[]` (ts2769).
   */
  static async aggregate<TResult = unknown, TSource = unknown>({
    modelName,
    pipeline,
    session = null,
  }: AggregateParams): Promise<TResult[]> {
    const model = getModel<TSource>(modelName);
    const aggregation = model.aggregate<TResult>(pipeline);
    if (session) aggregation.session(session);
    return aggregation.exec();
  }

  /**
   * Executes a bulk write operation (mixed insert / update / delete).
   * Far more efficient than firing individual operations in a loop.
   */
  static async bulkWrite<T>({
    modelName,
    operations,
    session = null,
    ordered = true,
  }: BulkWriteParams<T>) {
    const model = getModel<T>(modelName);

    return model.bulkWrite(operations as Parameters<typeof model.bulkWrite>[0], {
      ordered,
      ...(session && { session }),
    });
  }

  /**
   * Finds an existing document matching `condition`, or creates a new one
   * using `defaults` merged with the condition when no match is found.
   * Uses a single upsert to avoid race conditions.
   */
  static async findOrCreate<T>({
    modelName,
    condition,
    defaults = {},
    session = null,
  }: FindOrCreateParams<T>): Promise<{ doc: T; created: boolean }> {
    const model = getModel<T>(modelName);
    const sessionOpt = session ? { session } : {};

    const result = await model
      .findOneAndUpdate(
        condition,
        { $setOnInsert: { ...condition, ...defaults } },
        { upsert: true, new: true, rawResult: true, runValidators: true, ...sessionOpt },
      )
      .lean<T>()
      .exec();

    return {
      // @ts-expect-error: rawResult gives us `lastErrorObject`
      doc: result.value as T,
      // @ts-expect-error: rawResult gives us `lastErrorObject`
      created: !result.lastErrorObject?.updatedExisting,
    };
  }
}
