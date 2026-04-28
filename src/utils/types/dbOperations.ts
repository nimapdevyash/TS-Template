import type mongoose from 'mongoose';
import {
  type ClientSession,
  type PipelineStage,
  type PopulateOptions,
  type UpdateQuery,
} from 'mongoose';
import { type ModelName } from '@/utils/modelNames.js';

/**
 * Mongoose v9 no longer exposes FilterQuery as a named or namespace export.
 * The underlying filter type is mongo.Filter<T> from the bundled MongoDB driver,
 * which mongoose re-exposes via the `mongo` sub-namespace.
 */
type FilterQuery<T> = mongoose.mongo.Filter<T>;

// ─── Shared Base ─────────────────────────────────────────────────────────────

interface WithSession {
  session?: ClientSession | null;
}

// ─── Create ──────────────────────────────────────────────────────────────────

export interface CreateParams<T> extends WithSession {
  modelName: ModelName;
  body: Partial<T> | Partial<T>[];
}

// ─── Find ────────────────────────────────────────────────────────────────────

export interface QueryOptions<T> {
  condition?: FilterQuery<T>;
  select?: string | Record<string, 0 | 1>;
  /**
   * Use PopulateOptions or an array of PopulateOptions for type-safe population.
   * Plain strings are intentionally excluded — they bypass TypeScript checks on
   * path names and nested select/match options.
   */
  populate?: PopulateOptions | PopulateOptions[];
  sort?: Record<string, 1 | -1>;
  lean?: boolean;
}

export interface FindOneParams<T> extends WithSession {
  modelName: ModelName;
  options?: QueryOptions<T>;
}

export interface FindByIdParams<T> extends WithSession {
  modelName: ModelName;
  id: string;
  /**
   * Additional query options. `condition` is intentionally excluded — the _id
   * filter is handled internally via `model.findById`. Do not pass `_id` here.
   */
  options?: Omit<QueryOptions<T>, 'condition'>;
}

export interface FindManyParams<T> extends WithSession {
  modelName: ModelName;
  options?: QueryOptions<T> & {
    limit?: number;
    skip?: number;
  };
}

// ─── Update ──────────────────────────────────────────────────────────────────

export interface UpdateOptions {
  multi?: boolean;
  returnNew?: boolean;
  upsert?: boolean;
}

export interface UpdateParams<T> extends WithSession {
  modelName: ModelName;
  condition: FilterQuery<T>;
  updateData: UpdateQuery<T>;
  options?: UpdateOptions;
}

export interface UpdateByIdParams<T> extends WithSession {
  modelName: ModelName;
  id: string;
  updateData: UpdateQuery<T>;
  // `multi` is intentionally excluded — updating many docs by a single _id is nonsensical.
  options?: Omit<UpdateOptions, 'multi'>;
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export interface DeleteParams<T> extends WithSession {
  modelName: ModelName;
  condition: FilterQuery<T>;
  /**
   * When true, permanently removes the document(s) from the database.
   * When false (default), performs a soft delete by setting `deletedAt` timestamp.
   * Soft delete requires a `deletedAt: Date | null` field on your schema.
   */
  hardDelete?: boolean;
}

// ─── Restore ─────────────────────────────────────────────────────────────────

export type RestoreParams<T> = Omit<DeleteParams<T>, 'hardDelete'>;

// ─── Exists ──────────────────────────────────────────────────────────────────

export interface ExistsParams<T> extends WithSession {
  modelName: ModelName;
  condition: FilterQuery<T>;
}

// ─── Count ───────────────────────────────────────────────────────────────────

export interface CountParams<T> extends WithSession {
  modelName: ModelName;
  condition?: FilterQuery<T>;
}

// ─── Aggregate ───────────────────────────────────────────────────────────────

export interface AggregateParams<T = unknown> extends WithSession {
  modelName: ModelName;
  /**
   * Must be typed as PipelineStage[] — Mongoose's aggregate() overloads
   * do not accept loose Record<string, unknown>[] (ts2769).
   */
  pipeline: PipelineStage[];
}

// ─── Bulk Write ──────────────────────────────────────────────────────────────

export type BulkOperation<T> =
  | { insertOne: { document: Partial<T> } }
  | { updateOne: { filter: FilterQuery<T>; update: UpdateQuery<T>; upsert?: boolean } }
  | { updateMany: { filter: FilterQuery<T>; update: UpdateQuery<T>; upsert?: boolean } }
  | { deleteOne: { filter: FilterQuery<T> } }
  | { deleteMany: { filter: FilterQuery<T> } }
  | { replaceOne: { filter: FilterQuery<T>; replacement: Partial<T>; upsert?: boolean } };

export interface BulkWriteParams<T> extends WithSession {
  modelName: ModelName;
  operations: BulkOperation<T>[];
  ordered?: boolean;
}

// ─── Find or Create ──────────────────────────────────────────────────────────

export interface FindOrCreateParams<T> extends WithSession {
  modelName: ModelName;
  condition: FilterQuery<T>;
  defaults?: Partial<T>;
}
