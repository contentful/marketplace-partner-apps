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

export interface CodeSuggester {
  suggest: (options: ValidatorOptions, appDir: string) => Promise<CodeSuggestion | null>;
}

export interface CodeSuggestion {
  category: string;
  description: string;
  hasChanges: boolean;
  fileChanges: FileChange[];
}

export interface FileChange {
  path: string;
  description: string;
  newContent?: string;
  operation: 'create' | 'update' | 'delete';
}

export type PullRequestFile = components['schemas']['diff-entry'];
