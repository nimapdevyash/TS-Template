import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.resolve(__dirname, '../models');
const targetFile = path.resolve(__dirname, './modelNames.ts');

/**
 * Robust string cleaning: handles 'user.model', 'user-profile', 'User_Profile'
 */
const prepareWords = (str: string) =>
  str
    .replace(/\.(model|schema)$/i, '')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean);

const toPascalCase = (str: string) =>
  prepareWords(str)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');

const toCamelCase = (str: string) => {
  const words = prepareWords(str);
  return words
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join('');
};

const generateRegistry = () => {
  try {
    const files = fs
      .readdirSync(modelsDir)
      .filter(
        (f) =>
          !f.startsWith('.') &&
          !f.startsWith('index.') &&
          (f.endsWith('.ts') || f.endsWith('.js')),
      );

    const entries = files.map((file) => {
      const name = file.replace(/\.(ts|js)$/, '');
      return { key: toCamelCase(name), value: toPascalCase(name) };
    });

    const content = `/**
 * AUTOMATED MODEL NAME REGISTRY
 * NOTE: DON NOT UPDATE MANUALLY
 * TO GENERATE OR UPDATE REGISTRY RUN 'npm run gen:models'
 * Generated on: ${new Date().toISOString()}
 */
export const modelNames = {
${entries.map((e) => `  ${e.key}: '${e.value}',`).join('\n')}
} as const;

export type ModelName = (typeof modelNames)[keyof typeof modelNames];
`;

    fs.writeFileSync(targetFile, content);
    console.log(`✅ Generated registry with ${entries.length} models.`);
  } catch (err) {
    console.error('❌ Registry generation failed:', err);
  }
};

generateRegistry();
