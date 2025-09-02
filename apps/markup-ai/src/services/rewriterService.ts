import { checkContent, contentRewrite } from './apiService';
import type { FieldCheck, FieldCheckMap, RewriterConfig } from '../types/content';
import { MAX_FIELD_CHECKS } from '../constants/app';

export const createInitialFieldCheck = (
  fieldId: string,
  value: string,
  timestamp: number = Date.now(),
): FieldCheck => ({
  fieldId,
  originalValue: value,
  isChecking: false,
  checkResponse: null,
  error: null,
  lastUpdated: timestamp,
  hasRewriteResult: false,
});

export const updateFieldCheck = (
  prevChecks: FieldCheckMap,
  fieldId: string,
  updates: Partial<FieldCheck>,
): FieldCheckMap => {
  const newChecks = { ...prevChecks };

  if (!newChecks[fieldId] && Object.keys(newChecks).length >= MAX_FIELD_CHECKS) {
    const oldestFieldId = Object.entries(newChecks).sort(([, a], [, b]) => a.lastUpdated - b.lastUpdated)[0][0];
    delete newChecks[oldestFieldId];
  }

  newChecks[fieldId] = {
    ...newChecks[fieldId],
    ...updates,
    lastUpdated: Date.now(),
  };

  return newChecks;
};

export const contentCheck = async (fieldId: string, content: string, config: RewriterConfig): Promise<FieldCheck> => {
  console.log('Checking content:', {
    fieldId,
    content,
    contentType: typeof content,
    contentLength: content.length,
  });

  try {
    const result = await checkContent(content, config);
    console.log('Check result:', result);
    return {
      fieldId,
      originalValue: content,
      isChecking: false,
      checkResponse: result,
      error: null,
      lastUpdated: Date.now(),
      hasRewriteResult: false,
      checkConfig: config,
    };
  } catch (error) {
    console.error('Error checking content:', error);
    return {
      fieldId,
      originalValue: content,
      isChecking: false,
      checkResponse: null,
      error: error instanceof Error ? error.message : 'An error occurred while checking content',
      lastUpdated: Date.now(),
      hasRewriteResult: false,
      checkConfig: config,
    };
  }
};

export const rewriteContent = async (fieldId: string, content: string, config: RewriterConfig): Promise<FieldCheck> => {
  console.log('Rewriting content:', {
    fieldId,
    content,
    contentType: typeof content,
    contentLength: content.length,
  });

  try {
    const result = await contentRewrite(content, config);
    console.log('Rewrite result:', result);
    return {
      fieldId,
      originalValue: content,
      isChecking: false,
      checkResponse: result,
      error: null,
      hasRewriteResult: true,
      lastUpdated: Date.now(),
      checkConfig: config,
    };
  } catch (error) {
    console.error('Error rewriting content:', error);
    return {
      fieldId,
      originalValue: content,
      isChecking: false,
      checkResponse: null,
      hasRewriteResult: false,
      error: error instanceof Error ? error.message : 'An error occurred while rewriting content',
      lastUpdated: Date.now(),
      checkConfig: config,
    };
  }
};
