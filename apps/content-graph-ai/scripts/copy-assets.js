#!/usr/bin/env node
/**
 * Copy static assets to build output directory
 * This script is used during the build process to copy contentful-app and demo directories
 */

import { cp, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
// For Vercel, we copy static assets into the public directory
const outputDir = join(projectRoot, 'public');

async function copyDir(src, dest) {
  try {
    // Ensure destination directory exists
    const destParent = dirname(dest);
    if (!existsSync(destParent)) {
      await mkdir(destParent, { recursive: true });
    }
    
    // Copy directory recursively
    await cp(src, dest, { recursive: true });
    console.log(`✅ Copied ${src} → ${dest}`);
  } catch (error) {
    console.error(`❌ Failed to copy ${src}:`, error.message);
    // Don't fail the build if assets don't exist (they might be optional)
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function main() {
  console.log('📦 Copying static assets to public/ for Vercel...\n');
  
  const contentfulAppSrc = join(projectRoot, 'src', 'contentful-app');
  const contentfulAppDest = join(outputDir, 'app');
  
  const demoSrc = join(projectRoot, 'src', 'demo');
  const demoDest = join(outputDir, 'demo');
  
  // Copy directories if they exist
  if (existsSync(contentfulAppSrc)) {
    await copyDir(contentfulAppSrc, contentfulAppDest);
  } else {
    console.log(`⚠️  ${contentfulAppSrc} not found, skipping`);
  }
  
  if (existsSync(demoSrc)) {
    await copyDir(demoSrc, demoDest);
  } else {
    console.log(`⚠️  ${demoSrc} not found, skipping`);
  }
  
  console.log('\n✅ Asset copy complete');
}

main().catch((error) => {
  console.error('❌ Asset copy failed:', error);
  process.exit(1);
});

