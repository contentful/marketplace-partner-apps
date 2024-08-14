import { hasPackageJson } from '../../app-review-utils';
import * as path from 'path';
import type { PullRequestFile, ValidatorOptions, ValidatorResult } from '../../types';

export const validate = async (_options: ValidatorOptions, newAppDir: string, files: PullRequestFile[]): Promise<ValidatorResult> => {
  const hasTsConfig = !!files.find((file) => file.status === 'added' && file.filename.startsWith(`${newAppDir}/tsconfig.json`));
  const hasTsFiles = !!files.find(
    (file) => file.status === 'added' && file.filename.startsWith(newAppDir) && (file.filename.endsWith('.ts') || file.filename.endsWith('.tsx'))
  );

  let dependsOnTypescript = false;

  if (await hasPackageJson(files, newAppDir)) {
    const packageJsonPath = path.join(__dirname, '../../../../', newAppDir, 'package.json');
    const packageJson = require(packageJsonPath);
    dependsOnTypescript = packageJson.devDependencies && packageJson.devDependencies.typescript;
  }

  const result = hasTsConfig && hasTsFiles;
  const message =
    result && dependsOnTypescript
      ? 'TypeScript check passed'
      : 'TypeScript check failed: please include a tsconfig.json file, install typescript as a dev dependency, and include TypeScript files in your app directory';

  return {
    result,
    message,
  };
};
