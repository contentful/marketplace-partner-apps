import fs from 'fs';
import path from 'path';
import type { ValidatorOptions, CodeSuggestion } from '../../types';

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

const RECOMMENDED_TSCONFIG = {
  compilerOptions: {
    target: 'ES2020',
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    skipLibCheck: true,
    moduleResolution: 'bundler',
    allowImportingTsExtensions: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    jsx: 'react-jsx',
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noFallthroughCasesInSwitch: true,
    baseUrl: '.',
    paths: {
      '@/*': ['./src/*'],
    },
  },
  include: ['src/**/*'],
  exclude: ['node_modules', 'dist', 'build'],
};

const VITE_TSCONFIG = {
  compilerOptions: {
    target: 'ES2020',
    useDefineForClassFields: true,
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    skipLibCheck: true,
    moduleResolution: 'bundler',
    allowImportingTsExtensions: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    jsx: 'react-jsx',
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noFallthroughCasesInSwitch: true,
  },
  include: ['src'],
  references: [{ path: './tsconfig.node.json' }],
};

const VITE_NODE_TSCONFIG = {
  compilerOptions: {
    composite: true,
    skipLibCheck: true,
    module: 'ESNext',
    moduleResolution: 'bundler',
    allowSyntheticDefaultImports: true,
  },
  include: ['vite.config.ts'],
};

export const suggest = async (_options: ValidatorOptions, appDir: string): Promise<CodeSuggestion | null> => {
  const suggestions: string[] = [];
  const fileChanges: any[] = [];
  let hasChanges = false;

  const tsconfigExists = fileExists(appDir, 'tsconfig.json');
  const hasViteConfig = fileExists(appDir, 'vite.config.ts') || fileExists(appDir, 'vite.config.js');

  if (!tsconfigExists) {
    // Create appropriate tsconfig based on project type
    if (hasViteConfig) {
      // Create Vite-optimized TypeScript configuration
      fileChanges.push({
        path: `${appDir}/tsconfig.json`,
        description: 'Added Vite-optimized TypeScript configuration',
        newContent: JSON.stringify(VITE_TSCONFIG, null, 2) + '\n',
        operation: 'create',
      });

      fileChanges.push({
        path: `${appDir}/tsconfig.node.json`,
        description: 'Added TypeScript configuration for Vite node environment',
        newContent: JSON.stringify(VITE_NODE_TSCONFIG, null, 2) + '\n',
        operation: 'create',
      });

      suggestions.push('Created Vite-optimized TypeScript configuration files');
    } else {
      // Create general TypeScript configuration
      fileChanges.push({
        path: `${appDir}/tsconfig.json`,
        description: 'Added comprehensive TypeScript configuration',
        newContent: JSON.stringify(RECOMMENDED_TSCONFIG, null, 2) + '\n',
        operation: 'create',
      });

      suggestions.push('Created TypeScript configuration file');
    }

    hasChanges = true;
  } else {
    // Check existing tsconfig for improvements
    const tsconfigContent = readFile(appDir, 'tsconfig.json');
    if (tsconfigContent) {
      try {
        const tsconfig = JSON.parse(tsconfigContent);
        const compilerOptions = tsconfig.compilerOptions || {};

        let needsUpdate = false;
        const updatedTsconfig = { ...tsconfig };
        if (!updatedTsconfig.compilerOptions) {
          updatedTsconfig.compilerOptions = {};
        }

        // Check for important compiler options
        const recommendedOptions = {
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
        };

        for (const [option, value] of Object.entries(recommendedOptions)) {
          if (compilerOptions[option] !== value) {
            updatedTsconfig.compilerOptions[option] = value;
            needsUpdate = true;
          }
        }

        // Suggest including src directory if not specified
        if (!tsconfig.include || !tsconfig.include.includes('src')) {
          if (!updatedTsconfig.include) {
            updatedTsconfig.include = [];
          }
          if (!updatedTsconfig.include.includes('src')) {
            updatedTsconfig.include.push('src');
            needsUpdate = true;
          }
        }

        // Suggest excluding common directories
        const recommendedExcludes = ['node_modules', 'dist', 'build'];
        if (!tsconfig.exclude) {
          updatedTsconfig.exclude = recommendedExcludes;
          needsUpdate = true;
        } else {
          const missing = recommendedExcludes.filter((dir) => !tsconfig.exclude.includes(dir));
          if (missing.length > 0) {
            updatedTsconfig.exclude = [...tsconfig.exclude, ...missing];
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          fileChanges.push({
            path: `${appDir}/tsconfig.json`,
            description: 'Enhanced TypeScript configuration with recommended settings',
            newContent: JSON.stringify(updatedTsconfig, null, 2) + '\n',
            operation: 'update',
          });

          suggestions.push('Updated TypeScript configuration with best practices');
          hasChanges = true;
        }
      } catch (error) {
        console.error(`Failed to parse tsconfig.json for ${appDir}:`, error);
      }
    }
  }

  // Suggest adding Vite-specific tsconfig.node.json if missing but Vite is used
  if (hasViteConfig && !fileExists(appDir, 'tsconfig.node.json')) {
    fileChanges.push({
      path: `${appDir}/tsconfig.node.json`,
      description: 'Added TypeScript configuration for Vite node environment',
      newContent: JSON.stringify(VITE_NODE_TSCONFIG, null, 2) + '\n',
      operation: 'create',
    });

    suggestions.push('Added Vite node TypeScript configuration');
    hasChanges = true;
  }

  if (!hasChanges) {
    return null;
  }

  return {
    category: 'TypeScript Configuration',
    description: `Enhanced TypeScript setup with ${suggestions.length} improvements`,
    hasChanges: true,
    fileChanges,
  };
};
