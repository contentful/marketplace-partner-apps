import { hasPackageJson, packageJsonPath } from '../../app-review-utils';
import type { PullRequestFile, ValidatorOptions, ValidatorResult } from '../../types';

export const validate = async (_options: ValidatorOptions, newAppDir: string, files: PullRequestFile[]): Promise<ValidatorResult> => {
  // let hasEslintConfig = !!files.find(
  //   (file) => file.status === 'added' && (file.filename.startsWith(`${newAppDir}/.eslint`) || file.filename.startsWith(`${newAppDir}/eslint`))
  // );
  let dependsOnEslint = false;

  if (await hasPackageJson(files, newAppDir)) {
    const packageJson = await import(packageJsonPath(newAppDir));
    dependsOnEslint = packageJson.devDependencies && packageJson.devDependencies.eslint;
    // if (!hasEslintConfig) {
    //   hasEslintConfig = !!packageJson.eslintConfig;
    // }
  }

  const result = dependsOnEslint;
  const message = result ? 'ESLint check passed' : 'ESLint check failed: please include an ESLint dev dependency';

  return {
    result,
    message,
  };
};
