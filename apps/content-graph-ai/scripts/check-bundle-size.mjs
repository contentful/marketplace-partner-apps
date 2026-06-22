#!/usr/bin/env node
/**
 * Checks that the dist/ static bundle is under the 10 MB Contentful App Hosting limit.
 * Run after `npm run build`.
 */

import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const DIST_DIR = join(process.cwd(), 'dist');

function dirSize(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      total += dirSize(fullPath);
    } else {
      total += statSync(fullPath).size;
    }
  }
  return total;
}

const bytes = dirSize(DIST_DIR);
const mb = (bytes / 1024 / 1024).toFixed(2);

if (bytes > MAX_BYTES) {
  console.error(`Bundle too large: ${mb} MB (limit: 10 MB)`);
  process.exit(1);
}

console.log(`Bundle size: ${mb} MB (limit: 10 MB) — OK`);
