import { GitHub } from '@actions/github/lib/utils';
import { context as GitHubContext } from '@actions/github';
import * as core from '@actions/core';
import { components } from '@octokit/openapi-types';

export interface Validator {
  validate: (options: ValidatorOptions, newAppDir: string, files: PullRequestFile[]) => Promise<ValidatorResult>;
}

export interface ValidationResult {
  failures: Record<PropertyKey, string>;
  warnings: Record<PropertyKey, string>;
}

export interface ValidatorOptions {
  github: InstanceType<typeof GitHub>;
  ctx: typeof GitHubContext;
  ghCore: typeof core;
}

export interface ValidatorResult {
  result: boolean;
  message?: string;
  warning?: string;
}

export type PullRequestFile = components['schemas']['diff-entry'];
