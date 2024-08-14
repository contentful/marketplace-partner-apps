import {
  getPullRequestFiles,
  getNewAppDirectories,
  validateNewApps,
  handleValidationFailures,
  handleValidationSuccess,
  handleValidationWarnings,
} from '../app-review-utils';
import fs from 'fs';
import path from 'path';
import * as core from '@actions/core';
import type { Validator, ValidatorOptions } from '../types';

function loadValidators(directory: string): Record<PropertyKey, Validator> {
  const validators: Record<PropertyKey, Validator> = {};
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    if (file.endsWith('.js')) {
      const validatorName = path.basename(file, '.js');
      validators[validatorName] = require(path.join(directory, file));
    }
  });

  return validators;
}

const validators = loadValidators(path.join(__dirname, 'validators'));

async function review({ github, ctx, ghCore }: ValidatorOptions): Promise<void> {
  const prNumber = ctx.payload.pull_request?.number;

  if (!prNumber) {
    console.log('Pull request number is not found in the context payload.');
    return;
  }

  const files = await getPullRequestFiles(github, ctx, prNumber);
  const newAppDirs = getNewAppDirectories(files);

  if (newAppDirs.length === 0) {
    console.log('No new app submissions found.');
    return;
  }

  console.log('New app submissions found:', newAppDirs);

  const { failures, warnings } = await validateNewApps(validators, { github, ctx, ghCore }, newAppDirs, files);

  if (Object.keys(warnings).length > 0) {
    await handleValidationWarnings(github, ctx, prNumber, warnings);
  }

  if (Object.keys(failures).length > 0) {
    await handleValidationFailures(github, ctx, prNumber, failures);
    core.setFailed('Validation failed');
  } else {
    await handleValidationSuccess(github, ctx, prNumber);
  }
}

export { review };
