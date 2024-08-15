import { hasPackageJson } from '../../app-review-utils';
import * as path from 'path';
import type { PullRequestFile, ValidatorOptions, ValidatorResult } from '../../types';

export const validate = async (_options: ValidatorOptions, newAppDir: string, files: PullRequestFile[]): Promise<ValidatorResult> => {
  let hasEslintConfig = !!files.find(
    (file) => file.status === 'added' && (file.filename.startsWith(`${newAppDir}/.eslint`) || file.filename.startsWith(`${newAppDir}/eslint`))
  );
  let dependsOnEslint = false;

  if (await hasPackageJson(files, newAppDir)) {
    const packageJsonPath = path.join(__dirname, '../../../../../', newAppDir, 'package.json');
    const packageJson = await import(packageJsonPath);
    dependsOnEslint = packageJson.devDependencies && packageJson.devDependencies.eslint;
    if (!hasEslintConfig) {
      hasEslintConfig = !!packageJson.eslintConfig;
    }
  }

  const result = hasEslintConfig && dependsOnEslint;
  const message = result ? 'ESLint check passed' : 'ESLint check failed: please include an ESLint configuration file and install ESLint as a dev dependency';

  return {
    result,
    message,
  };
};
