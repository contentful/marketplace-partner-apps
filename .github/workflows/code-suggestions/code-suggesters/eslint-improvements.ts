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

function fileExists(appDir: string, fileName: string): boolean {
  const filePath = path.join(process.cwd(), appDir, fileName);
  return fs.existsSync(filePath);
}

const RECOMMENDED_ESLINT_CONFIG = {
  extends: ['eslint:recommended', '@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
};

const RECOMMENDED_DEPENDENCIES = {
  eslint: '^8.0.0',
  '@typescript-eslint/eslint-plugin': '^6.0.0',
  '@typescript-eslint/parser': '^6.0.0',
};

export const suggest = async (_options: ValidatorOptions, appDir: string): Promise<CodeSuggestion | null> => {
  const packageJson = readPackageJson(appDir);
  if (!packageJson) {
    return null;
  }

  const suggestions: string[] = [];
  const fileChanges: any[] = [];
  let hasChanges = false;

  // Check if ESLint config exists
  const eslintConfigFiles = ['.eslintrc.json', '.eslintrc.js', '.eslintrc.yml', '.eslintrc.yaml'];
  const existingConfig = eslintConfigFiles.find((file) => fileExists(appDir, file));

  // If no ESLint config exists, suggest creating one
  if (!existingConfig && !packageJson.eslintConfig) {
    fileChanges.push({
      path: `${appDir}/.eslintrc.json`,
      description: 'Added comprehensive ESLint configuration',
      newContent: JSON.stringify(RECOMMENDED_ESLINT_CONFIG, null, 2) + '\n',
      operation: 'create',
    });
    suggestions.push('Created ESLint configuration file');
    hasChanges = true;
  }

  // Check if ESLint dependencies are present
  const currentDevDeps = packageJson.devDependencies || {};
  const missingDeps: Record<string, string> = {};

  for (const [dep, version] of Object.entries(RECOMMENDED_DEPENDENCIES)) {
    if (!currentDevDeps[dep]) {
      missingDeps[dep] = version;
    }
  }

  if (Object.keys(missingDeps).length > 0) {
    const updatedPackageJson = { ...packageJson };
    if (!updatedPackageJson.devDependencies) {
      updatedPackageJson.devDependencies = {};
    }

    Object.assign(updatedPackageJson.devDependencies, missingDeps);

    fileChanges.push({
      path: `${appDir}/package.json`,
      description: `Added missing ESLint dependencies: ${Object.keys(missingDeps).join(', ')}`,
      newContent: JSON.stringify(updatedPackageJson, null, 2) + '\n',
      operation: 'update',
    });

    suggestions.push(`Added ${Object.keys(missingDeps).length} missing ESLint dependencies`);
    hasChanges = true;
  }

  // Suggest adding .eslintignore if it doesn't exist
  if (!fileExists(appDir, '.eslintignore')) {
    const eslintIgnoreContent = `# Dependencies
node_modules/

# Build outputs
dist/
build/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Coverage reports
coverage/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~
`;

    fileChanges.push({
      path: `${appDir}/.eslintignore`,
      description: 'Added ESLint ignore file with common patterns',
      newContent: eslintIgnoreContent,
      operation: 'create',
    });

    suggestions.push('Created .eslintignore file');
    hasChanges = true;
  }

  if (!hasChanges) {
    return null;
  }

  return {
    category: 'ESLint Configuration',
    description: `Enhanced ESLint setup with ${suggestions.length} improvements`,
    hasChanges: true,
    fileChanges,
  };
};
