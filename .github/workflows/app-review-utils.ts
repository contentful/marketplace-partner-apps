import { exec } from 'child_process';
import { promisify } from 'util';
import type { PullRequestFile, ValidationResult, Validator, ValidatorOptions } from './types';

const execPromise = promisify(exec);

const FAILURE_LABEL = 'Further development recommended';
const SUCCESS_LABEL = 'Ready for review';

const getPullRequestFiles = async (github: ValidatorOptions['github'], ctx: ValidatorOptions['ctx'], prNumber: number) => {
  const { data: files } = await github.rest.pulls.listFiles({
    owner: ctx.repo.owner,
    repo: ctx.repo.repo,
    pull_number: prNumber,
  });
  return files;
};

const getNewAppDirectories = (files: PullRequestFile[]) => {
  const newAppDirs = files
    .filter((file) => file.status === 'added' && file.filename.startsWith('apps/'))
    .map((file) => file.filename.split('/').slice(0, 2).join('/'));
  return [...new Set(newAppDirs)];
};

const installAppDependencies = async (newAppDir: string) => {
  try {
    await execPromise(`(cd ${newAppDir} && npm ci)`);
  } catch (error) {
    console.error(`Failed to install app dependencies for ${newAppDir}: ${error}`);
  }
};

const validateNewApps = async (
  validators: Record<string, Validator>,
  { github, ctx, ghCore }: ValidatorOptions,
  newAppDirs: string[],
  files: PullRequestFile[]
): Promise<ValidationResult> => {
  const failures: ValidationResult['failures'] = {};
  const warnings: ValidationResult['warnings'] = {};

  for (const newAppDir of newAppDirs) {
    await installAppDependencies(newAppDir);
    for (const [check, validator] of Object.entries(validators)) {
      if (typeof validator.validate === 'function') {
        const validation = await validator.validate({ github, ctx, ghCore }, newAppDir, files);
        validation.message = validation.message ?? `${check} check ${validation.result ? 'passed' : 'failed'}`;
        console.log(validation.message);
        if (!validation.result) {
          failures[check] = validation.message;
        }
        if (validation.warning) {
          warnings[check] = validation.warning;
        }
      }
    }
  }
  return {
    failures,
    warnings,
  };
};

const handleValidationFailures = async (
  github: ValidatorOptions['github'],
  ctx: ValidatorOptions['ctx'],
  prNumber: number,
  failures: Record<string, string>
) => {
  const commentBody = 'Your new app has a few validation issues. Please address the following failed check(s) below:\n' + Object.values(failures).join('\n');

  await github.rest.issues.createComment({
    ...ctx.repo,
    issue_number: prNumber,
    body: commentBody,
  });

  try {
    await github.rest.issues.removeLabel({
      ...ctx.repo,
      issue_number: prNumber,
      name: SUCCESS_LABEL,
    });
  } catch (error) {}

  await github.rest.issues.addLabels({
    ...ctx.repo,
    issue_number: prNumber,
    labels: [FAILURE_LABEL],
  });
};

const handleValidationSuccess = async (github: ValidatorOptions['github'], ctx: ValidatorOptions['ctx'], prNumber: number) => {
  try {
    await github.rest.issues.removeLabel({
      ...ctx.repo,
      issue_number: prNumber,
      name: FAILURE_LABEL,
    });
  } catch (error) {}
  await github.rest.issues.addLabels({
    ...ctx.repo,
    issue_number: prNumber,
    labels: [SUCCESS_LABEL],
  });
};

const handleValidationWarnings = async (
  github: ValidatorOptions['github'],
  ctx: ValidatorOptions['ctx'],
  prNumber: number,
  warnings: ValidationResult['warnings']
) => {
  const commentBody =
    'Please acknowledge the following warnings:\n' +
    Object.values(warnings)
      .map((warning) => `- [ ] ${warning}`)
      .join('\n');

  await github.rest.issues.createComment({
    ...ctx.repo,
    issue_number: prNumber,
    body: commentBody,
  });
};

const hasPackageJson = async (files: PullRequestFile[], newAppDir: string): Promise<boolean> =>
  !!files.find((file) => file.status === 'added' && file.filename.startsWith(`${newAppDir}/package.json`));

export {
  getPullRequestFiles,
  getNewAppDirectories,
  validateNewApps,
  handleValidationFailures,
  handleValidationSuccess,
  handleValidationWarnings,
  hasPackageJson,
};
