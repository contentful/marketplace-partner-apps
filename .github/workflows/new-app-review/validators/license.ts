import type { PullRequestFile, ValidatorOptions } from '../../types';

module.exports = {
  validate: async (_options: ValidatorOptions, newAppDir: string, files: PullRequestFile[]) => {
    const hasLicense = !!files.find((file) => file.status === 'added' && file.filename.startsWith(`${newAppDir}/LICENSE`));

    return {
      result: hasLicense,
      message: hasLicense ? 'License check passed' : 'License check failed: please include a file named LICENSE at the root of your app directory',
    };
  },
};
