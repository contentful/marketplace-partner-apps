import { useApiService } from "../hooks/useApiService";
import type { FieldCheck, FieldCheckMap, RewriterConfig } from "../types/content";
import { MAX_FIELD_CHECKS } from "../constants/app";
import { getApiErrorMessage } from "../utils/errorMessage";

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

  if (!(fieldId in newChecks) && Object.keys(newChecks).length >= MAX_FIELD_CHECKS) {
    const oldestFieldId = Object.entries(newChecks).sort(
      ([, a], [, b]) => a.lastUpdated - b.lastUpdated,
    )[0][0];
    Reflect.deleteProperty(newChecks, oldestFieldId);
  }

  newChecks[fieldId] = {
    ...newChecks[fieldId],
    ...updates,
    lastUpdated: Date.now(),
  };

  return newChecks;
};

// Hook-based rewriter service that uses React Query internally
export function useRewriterService(config: RewriterConfig) {
  const { checkContent, contentRewrite } = useApiService(config);

  const contentCheck = async (fieldId: string, content: string): Promise<FieldCheck> => {
    console.log("Checking content:", {
      fieldId,
      content,
      contentType: typeof content,
      contentLength: content.length,
    });

    try {
      const result = await checkContent(content);
      console.log("Check result:", result);
      return {
        fieldId,
        originalValue: content,
        isChecking: false,
        checkResponse: {
          ...result,
          original: result.original
            ? {
                scores: result.original.scores,
              }
            : undefined,
        },
        error: null,
        lastUpdated: Date.now(),
        hasRewriteResult: false,
        checkConfig: config,
      };
    } catch (error) {
      console.error("Error checking content:", error);
      return {
        fieldId,
        originalValue: content,
        isChecking: false,
        checkResponse: null,
        error: getApiErrorMessage(error),
        lastUpdated: Date.now(),
        hasRewriteResult: false,
        checkConfig: config,
      };
    }
  };

  const rewriteContent = async (fieldId: string, content: string): Promise<FieldCheck> => {
    console.log("Rewriting content:", {
      fieldId,
      content,
      contentType: typeof content,
      contentLength: content.length,
    });

    try {
      const result = await contentRewrite(content);
      console.log("Rewrite result:", result);
      return {
        fieldId,
        originalValue: content,
        isChecking: false,
        checkResponse: {
          ...result,
          original: result.original
            ? {
                scores: result.original.scores,
              }
            : undefined,
          rewrite: result.rewrite
            ? {
                text: result.rewrite.text,
                scores: result.rewrite.scores,
              }
            : undefined,
        },
        error: null,
        hasRewriteResult: true,
        lastUpdated: Date.now(),
        checkConfig: config,
      };
    } catch (error) {
      console.error("Error rewriting content:", error);
      return {
        fieldId,
        originalValue: content,
        isChecking: false,
        checkResponse: null,
        hasRewriteResult: false,
        error: getApiErrorMessage(error),
        lastUpdated: Date.now(),
        checkConfig: config,
      };
    }
  };

  return {
    contentCheck,
    rewriteContent,
  };
}
