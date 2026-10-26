import fs from 'fs';
import path from 'path';
import type { CodeSuggester } from './types';

async function getSuggesters(directory: string): Promise<Record<PropertyKey, CodeSuggester>> {
  const suggesters: Record<PropertyKey, CodeSuggester> = {};

  if (!fs.existsSync(directory)) {
    console.log(`Code suggesters directory not found: ${directory}`);
    return suggesters;
  }

  const files = fs.readdirSync(directory);

  // suggesters will be compiled by the time this runs
  const suggesterExtension = '.js';

  for (const file of files) {
    if (file.endsWith(suggesterExtension)) {
      const suggesterName = path.basename(file, suggesterExtension);
      try {
        suggesters[suggesterName] = await import(path.join(directory, file));
      } catch (error) {
        console.error(`Failed to load suggester ${suggesterName}:`, error);
      }
    }
  }

  return suggesters;
}

function readPackageJson(appDir: string): any {
  const packageJsonPath = path.join(process.cwd(), appDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    console.error(`Failed to read package.json for ${appDir}:`, error);
    return null;
  }
}

function writePackageJson(appDir: string, packageJson: any): string {
  return JSON.stringify(packageJson, null, 2) + '\n';
}

function fileExists(appDir: string, fileName: string): boolean {
  const filePath = path.join(process.cwd(), appDir, fileName);
  return fs.existsSync(filePath);
}

function readFile(appDir: string, fileName: string): string | null {
  const filePath = path.join(process.cwd(), appDir, fileName);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Failed to read file ${fileName} for ${appDir}:`, error);
    return null;
  }
}

export { getSuggesters, readPackageJson, writePackageJson, fileExists, readFile };
