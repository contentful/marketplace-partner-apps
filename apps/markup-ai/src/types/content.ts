import { EntryFieldAPI, FieldAPI } from '@contentful/app-sdk';
import { RewriteResponse, StyleCheckResponse } from '../api-client';

export const TEXT_FIELD_TYPES = ['Symbol', 'Text', 'RichText'] as const;
export type TextFieldType = (typeof TEXT_FIELD_TYPES)[number];

export interface FieldChange {
  fieldId: string;
  value: string;
}

export interface ScoreDetail {
  score: number;
  word_count?: number;
  sentence_count?: number;
  average_sentence_length?: number;
  flesch_reading_ease?: number;
  vocabulary_complexity?: number;
  sentence_complexity?: number;
  issues?: number;
  informality?: number;
  liveliness?: number;
}

export interface FieldCheck {
  fieldId: string;
  originalValue: string;
  isChecking: boolean;
  checkResponse: StyleCheckResponse | RewriteResponse | null | undefined;
  error: string | null;
  lastUpdated: number;
  hasRewriteResult: boolean;
  checkConfig?: RewriterConfig;
}

export interface FieldCheckMap {
  [fieldId: string]: FieldCheck;
}

export interface RewriterConfig {
  apiKey: string;
  dialect?: string;
  tone?: string;
  styleGuide?: string;
}

export type PlatformConfig = RewriterConfig;

export const isTextField = (field: EntryFieldAPI | FieldAPI): boolean => {
  return TEXT_FIELD_TYPES.includes(field.type as TextFieldType);
};
