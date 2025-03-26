import { hasPackageJson, packageJsonPath } from '../../app-review-utils';
import type { PullRequestFile, ValidatorOptions, ValidatorResult } from '../../types';

export const validate = async (_options: ValidatorOptions, newAppDir: string, files: PullRequestFile[]): Promise<ValidatorResult> => {
  let dependsOnEslint = false;

  if (await hasPackageJson(files, newAppDir)) {
    const packageJson = await import(packageJsonPath(newAppDir));
    dependsOnEslint = packageJson.devDependencies && packageJson.devDependencies.eslint;
  }

  const result = dependsOnEslint;
  const message = result ? 'ESLint check passed' : 'ESLint check failed: please include an ESLint dev dependency';

  return {
    result,
    message,
  };
};
