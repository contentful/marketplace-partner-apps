#!/usr/bin/env node
/**
 * Builds the static Contentful sidebar app bundle into dist/.
 * The sidebar app (public/app/) is already client-side rendered HTML/JS —
 * this script copies it to dist/ so it can be uploaded to Contentful App Hosting.
 *
 * Server-side pipeline routes (api/) are deployed separately on Vercel.
 */

import { cp, rm, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'public', 'app');
const dist = join(root, 'dist');

if (!existsSync(src)) {
  console.error(`Source directory not found: ${src}`);
  process.exit(1);
}

// Clean and recreate dist/
if (existsSync(dist)) {
  await rm(dist, { recursive: true });
}
await mkdir(dist, { recursive: true });

await cp(src, dist, { recursive: true });

console.log(`Built static bundle: ${src} -> ${dist}`);
