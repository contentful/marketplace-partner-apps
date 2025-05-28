import type { PullRequestFile, ValidatorOptions, ValidatorResult } from '../../types';

export const validate = async (_options: ValidatorOptions, newAppDir: string, files: PullRequestFile[]): Promise<ValidatorResult> => {
  const hasReadme = !!files.find((file) => file.status === 'added' && file.filename.startsWith(`${newAppDir}/README.md`));

  const result = Boolean(hasReadme);
  const message =
    result
      ? 'Readme check passed'
      : 'Readme check failed: please include a README.md file';

  return {
    result,
    message,
  };
};
