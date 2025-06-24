import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import type { PullRequestFile, ValidationResult, Validator, ValidatorOptions } from './types';

const execPromise = promisify(exec);

const FAILURE_LABEL = 'Partner Action Needed';
const SUCCESS_LABEL = 'Pending Contentful Review';

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
    // Only consider an PR to contain a new app if a new package.json file was added inside an `apps/` directory
    .filter((file) => file.status === 'added' && file.filename.startsWith('apps/') && file.filename.endsWith('package.json'))
    .map((file) => file.filename.split('/').slice(0, 2).join('/'));
  return [...new Set(newAppDirs)];
};

const sanitizeAppDirectory = (appDir: string): string => {
  // Ensure the directory path is safe and within the apps directory
  const normalizedPath = path.normalize(appDir);
  const resolvedPath = path.resolve(normalizedPath);
  const appsPath = path.resolve('apps');

  // Ensure the path is within the apps directory and doesn't contain path traversal
  if (!resolvedPath.startsWith(appsPath + path.sep) || normalizedPath.includes('..')) {
    throw new Error(`Invalid app directory path: ${appDir}`);
  }

  // Additional validation - ensure it's a simple apps/appname structure
  const pathParts = normalizedPath.split(path.sep);
  if (pathParts.length !== 2 || pathParts[0] !== 'apps' || !pathParts[1] || pathParts[1].includes(' ')) {
    throw new Error(`Invalid app directory structure: ${appDir}`);
  }

  return normalizedPath;
};

const installAppDependencies = async (newAppDir: string) => {
  try {
    // Sanitize the directory path
    const sanitizedDir = sanitizeAppDirectory(newAppDir);

    // Use proper escaping and validation
    await execPromise(`cd ${JSON.stringify(sanitizedDir)} && npm ci`);
  } catch (error) {
    console.error(`Failed to install app dependencies for ${newAppDir}: ${error}`);
    throw error; // Re-throw to handle validation failures properly
  }
};

const validateNewApps = async (
  validators: Record<PropertyKey, Validator>,
  options: ValidatorOptions,
  newAppDirs: string[],
  files: PullRequestFile[]
): Promise<ValidationResult> => {
  const failures: ValidationResult['failures'] = {};
  const warnings: ValidationResult['warnings'] = {};

  for (const newAppDir of newAppDirs) {
    await installAppDependencies(newAppDir);
    for (const [check, validator] of Object.entries(validators)) {
      if (typeof validator.validate === 'function') {
        const validation = await validator.validate(options, newAppDir, files);
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
  const commentBody =
    'Your new app has a few validation issues. Please address the following failed check(s) below:\n' +
    Object.values(failures)
      .map((failure) => `- ${failure}`)
      .join('\n');

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
    'Please acknowledge the following warnings about your new app submission:\n' +
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

const packageJsonPath = function (newAppDir: string) {
  return path.join(__dirname, '../../../', newAppDir, 'package.json');
};

export {
  getPullRequestFiles,
  getNewAppDirectories,
  validateNewApps,
  handleValidationFailures,
  handleValidationSuccess,
  handleValidationWarnings,
  hasPackageJson,
  packageJsonPath,
  sanitizeAppDirectory,
};
