import fs from 'fs';
import path from 'path';
import type { ValidatorOptions, CodeSuggestion } from '../../types';

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

export const suggest = async (_options: ValidatorOptions, appDir: string): Promise<CodeSuggestion | null> => {
  const packageJson = readPackageJson(appDir);
  if (!packageJson) {
    return null;
  }

  const suggestions: string[] = [];
  const updatedPackageJson = { ...packageJson };
  let hasChanges = false;

  // Suggest adding missing install-ci script if missing
  if (!packageJson.scripts?.['install-ci']) {
    if (!updatedPackageJson.scripts) {
      updatedPackageJson.scripts = {};
    }
    updatedPackageJson.scripts['install-ci'] = 'npm ci';
    suggestions.push('Added install-ci script for consistent dependency installation');
    hasChanges = true;
  }

  // Suggest improving test script if it's just a basic one
  if (packageJson.scripts?.test === 'echo "Error: no test specified" && exit 1') {
    updatedPackageJson.scripts.test = 'vitest';
    if (!packageJson.devDependencies?.vitest) {
      if (!updatedPackageJson.devDependencies) {
        updatedPackageJson.devDependencies = {};
      }
      updatedPackageJson.devDependencies.vitest = '^1.0.0';
    }
    suggestions.push('Replaced placeholder test script with vitest');
    hasChanges = true;
  }

  // Suggest adding keywords for better discoverability
  if (!packageJson.keywords || packageJson.keywords.length === 0) {
    updatedPackageJson.keywords = ['contentful', 'contentful-app', 'marketplace'];
    suggestions.push('Added relevant keywords for better package discoverability');
    hasChanges = true;
  }

  // Suggest adding or improving description
  if (!packageJson.description || packageJson.description.length < 10) {
    if (!updatedPackageJson.description) {
      updatedPackageJson.description = `A Contentful marketplace app for ${appDir.split('/').pop()}`;
      suggestions.push('Added descriptive package description');
      hasChanges = true;
    }
  }

  // Suggest adding repository field if missing
  if (!packageJson.repository) {
    updatedPackageJson.repository = {
      type: 'git',
      url: 'https://github.com/contentful/marketplace-partner-apps.git',
      directory: appDir,
    };
    suggestions.push('Added repository information');
    hasChanges = true;
  }

  // Suggest adding homepage field if missing
  if (!packageJson.homepage) {
    updatedPackageJson.homepage = 'https://www.contentful.com/marketplace/';
    suggestions.push('Added homepage URL');
    hasChanges = true;
  }

  if (!hasChanges) {
    return null;
  }

  return {
    category: 'Package.json Improvements',
    description: `Enhanced package.json with ${suggestions.length} improvements`,
    hasChanges: true,
    fileChanges: [
      {
        path: `${appDir}/package.json`,
        description: suggestions.join(', '),
        newContent: writePackageJson(appDir, updatedPackageJson),
        operation: 'update',
      },
    ],
  };
};
