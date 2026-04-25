import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

// Dynamically scan the directory and mount routers
const files = fs.readdirSync(__dirname).filter((file) => {
  return (
    file.indexOf('.') !== 0 &&
    file !== basename &&
    (file.endsWith('.ts') || file.endsWith('.js')) &&
    !file.endsWith('.d.ts') // Ignore declaration files
  );
});

for (const file of files) {
  // Generate the URL path: 'user.routes.ts' -> '/user'
  const fileName = file.split('.')[0];
  const mainRoute = fileName ? `/${fileName}` : '/';

  // Import the file dynamically
  // We use pathToFileURL to ensure Windows compatibility with ESM imports
  const filePath = pathToFileURL(path.join(__dirname, file)).href;
  const routeModule = await import(filePath);

  // Supports both 'export default' and 'module.exports'
  const importedRouter = routeModule.default || routeModule;

  if (
    typeof importedRouter === 'function' ||
    Object.getPrototypeOf(importedRouter) === Router
  ) {
    router.use(mainRoute, importedRouter);
    console.info(`✅ Route mounted: ${mainRoute}`);
  }
}

export default router;
