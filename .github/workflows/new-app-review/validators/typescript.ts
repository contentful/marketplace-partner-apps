import { hasPackageJson, packageJsonPath } from '../../app-review-utils';
import type { PullRequestFile, ValidatorOptions, ValidatorResult } from '../../types';

export const validate = async (_options: ValidatorOptions, newAppDir: string, files: PullRequestFile[]): Promise<ValidatorResult> => {
  const hasTsFiles = !!files.find(
    (file) => file.status === 'added' && file.filename.startsWith(newAppDir) && (file.filename.endsWith('.ts') || file.filename.endsWith('.tsx'))
  );

  const hasJsFiles = !!files.find(
    (file) => file.status === 'added' && file.filename.startsWith(newAppDir) && (file.filename.endsWith('.js'))
  );

  let dependsOnTypescript = false;

  if (await hasPackageJson(files, newAppDir)) {
    const packageJson = require(packageJsonPath(newAppDir));
    console.log("packageJson", packageJson);
    dependsOnTypescript = packageJson.devDependencies && packageJson.devDependencies.typescript;
  }

  let message = hasTsFiles && dependsOnTypescript
    ? 'TypeScript check passed'
    : 'TypeScript check failed: please include a tsconfig.json file, install typescript as a dev dependency, and include TypeScript files in your app directory';

  if (hasJsFiles) {
    message += ' Note: JavaScript files are present in the directory.';
  }

  // currently only warning about typescript validation
  // update this when we want to enforce typescript
  return {
    result: true,
    warning: message,
    message,
  };
};
