import type { ValidatorOptions, ValidatorResult, PullRequestFile } from '../../types';

export const validate = async (_options: ValidatorOptions, newAppDir: string, _files: PullRequestFile[]): Promise<ValidatorResult> => {
  return new Promise((resolve, reject) => {
    // check files for boilerplate
    _files.forEach((file) => {
        console.log('File: ', file)
    });
});
};
