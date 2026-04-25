import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Model } from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Use a Record that expects the base Model interface.
 * This satisfies the linter and provides base Mongoose methods (find, create, etc.)
 */
const models: Record<string, Model<unknown>> = {};

// Filter out index.ts and non-source files
const files = fs
  .readdirSync(__dirname)
  .filter(
    (file) =>
      file !== 'index.ts' &&
      !file.endsWith('.d.ts') &&
      (file.endsWith('.ts') || file.endsWith('.js')),
  );

// Dynamically import and register models
for (const file of files) {
  try {
    // Cast the import as a module with a default export of type MongooseModel
    const modelModule = (await import(`./${file}`)) as {
      default: Model<unknown>;
    };
    const modelInstance = modelModule.default;

    // Ensure it's a valid Mongoose model by checking for modelName
    if (modelInstance?.modelName) {
      models[modelInstance.modelName] = modelInstance;
    }
  } catch (error) {
    console.error(`❌ Failed to load model from file: ${file}`, error);
  }
}

/**
 * Export the collection.
 * If you want to get specific type autocomplete elsewhere,
 * you can cast this to a custom interface.
 */
export default models;
