import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Model } from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const models: Record<string, Model<any>> = {};

// Filter out index.ts and load all other files
const files = fs
  .readdirSync(__dirname)
  .filter(
    (file) =>
      file !== 'index.ts' && (file.endsWith('.ts') || file.endsWith('.js')),
  );

for (const file of files) {
  const modelModule = await import(`./${file}`);
  // Assumes your model files use default export for the Mongoose model
  const modelInstance = modelModule.default;
  if (modelInstance?.modelName) {
    models[modelInstance.modelName] = modelInstance;
  }
}

export default models;
