import { hasPackageJson, packageJsonPath } from '../../app-review-utils';
import type { PullRequestFile, ValidatorOptions, ValidatorResult } from '../../types';

export const validate = async (_options: ValidatorOptions, newAppDir: string, files: PullRequestFile[]): Promise<ValidatorResult> => {
  const requiredScripts = ['start', 'build', 'test', 'lint'];
  let hasScripts = false;
  let isCorrectVersion = false;

  if (await hasPackageJson(files, newAppDir)) {
    const packageJson = await import(packageJsonPath(newAppDir));

    hasScripts = requiredScripts.every((script) => packageJson.scripts && packageJson.scripts[script]);
    isCorrectVersion = packageJson.version.startsWith('0');
  }

  const result = hasScripts && isCorrectVersion;
  let message = 'package.json check passed';

  if (!result) {
    let failureMessage = '';
    if (!hasScripts) {
      failureMessage += `package.json is missing one or more of the following scripts: ${requiredScripts.join(', ')}. `;
    }
    if (!isCorrectVersion) {
      failureMessage += 'package.json version should be less than 1.0.';
    }
    message = failureMessage;
  }

  return {
    result,
    message,
  };
};
