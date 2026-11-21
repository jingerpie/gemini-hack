// Pre-built shop catalog: mock-shop listings, each with a product image and a build(THREE) model file.
// Consumers read the files from disk (server) or glob them through a Vite alias (web).
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Folder that holds catalog.json and the <kind>/<nn>-<slug>.{build.js,png} files. */
export const CATALOG_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mock-shop');
/** The listing index: one entry per product, with imageFile and modelFile paths relative to CATALOG_DIR. */
export const CATALOG_JSON = path.join(CATALOG_DIR, 'catalog.json');
