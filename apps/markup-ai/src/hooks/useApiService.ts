import { useCallback, useState, useEffect, useRef } from "react";
import {
  useGetAdminConstants,
  useListStyleGuides,
  useCreateStyleCheck,
  useGetStyleCheck,
  useCreateStyleRewrite,
  useGetStyleRewrite,
} from "./useStyleAndBrandAgent";
import type { PlatformConfig } from "../types/content";
import {
  Dialects,
  RewriteResponse,
  StyleCheckResponse,
  Tones,
  WorkflowStatus,
} from "../api-client/types.gen";
import { isLikelyHtmlString, isLikelyMarkdownString } from "../utils/contentDetection";
import { WORKFLOW_POLLING_INTERVAL, WORKFLOW_TIMEOUT } from "../constants/app";

// Type mappings from the new API to maintain compatibility
export type Constants = {
  dialects: string[];
  tones: string[];
  style_guides: { [key: string]: string };
};

export type StyleGuides = Array<{
  id: string;
  name: string;
  created_at: string;
  updated_at?: string | null;
}>;

export function validateConfig(
  config: PlatformConfig | undefined,
): asserts config is PlatformConfig {
  if (!config?.apiKey) {
    throw new Error("Configuration is missing. Please configure the app first.");
  }
}

/**
 * Wrap HTML fragment in a proper HTML document structure
 */
const wrapInHtmlDocument = (content: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
</head>
<body>
${content}
</body>
</html>`;
};

/**
 * Check if content is already a full HTML document
 */
const isFullHtmlDocument = (content: string): boolean => {
  const trimmed = content.trim();
  return /^<!DOCTYPE\s+html/i.test(trimmed) || /^<html/i.test(trimmed);
};

// Helper function to create a Blob from string content
// Ensures HTML content is wrapped in a proper document structure
const createContentBlob = (content: string): File => {
  let mimeType = "text/plain";
  let extension = ".txt";
  let finalContent = content;

  if (isLikelyHtmlString(content)) {
    mimeType = "text/html";
    extension = ".html";
    // Wrap in full document if it's just an HTML fragment
    if (!isFullHtmlDocument(content)) {
      finalContent = wrapInHtmlDocument(content);
    }
  } else if (isLikelyMarkdownString(content)) {
    mimeType = "text/markdown";
    extension = ".md";
  }

  return new File([finalContent], `content${extension}`, { type: mimeType });
};

// Helper function for polling workflow completion
const pollWorkflowCompletion = <T>(
  resultRef: React.MutableRefObject<T | null>,
  failedRef: React.MutableRefObject<boolean>,
  clearWorkflowId: () => void,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const cleanup = (
      checkInterval: ReturnType<typeof setInterval>,
      timeoutId: ReturnType<typeof setTimeout>,
    ) => {
      clearInterval(checkInterval);
      clearTimeout(timeoutId);
    };

    const timeoutId = setTimeout(() => {
      cleanup(checkInterval, timeoutId);
      clearWorkflowId();
      reject(new Error("Workflow timed out"));
    }, WORKFLOW_TIMEOUT);

    const checkInterval = setInterval(() => {
      if (resultRef.current) {
        cleanup(checkInterval, timeoutId);
        resolve(resultRef.current);
      } else if (failedRef.current) {
        cleanup(checkInterval, timeoutId);
        reject(new Error("Workflow failed"));
      }
    }, WORKFLOW_POLLING_INTERVAL);
  });
};

// Hook-based service that uses React Query internally
export function useApiService(config: PlatformConfig) {
  const [activeCheckWorkflowId, setActiveCheckWorkflowId] = useState<string | null>(null);
  const [activeRewriteWorkflowId, setActiveRewriteWorkflowId] = useState<string | null>(null);

  // Use refs to track current results for the polling logic
  const checkResultRef = useRef<StyleCheckResponse | null>(null);
  const rewriteResultRef = useRef<RewriteResponse | null>(null);
  const checkFailedRef = useRef<boolean>(false);
  const rewriteFailedRef = useRef<boolean>(false);

  // Get admin constants
  const {
    data: constantsData,
    isLoading: constantsLoading,
    error: constantsError,
  } = useGetAdminConstants(config);

  // Get style guides
  const {
    data: styleGuidesData,
    isLoading: styleGuidesLoading,
    error: styleGuidesError,
  } = useListStyleGuides(config);

  // Create style check mutation
  const createStyleCheckMutation = useCreateStyleCheck(config);

  // Create style rewrite mutation
  const createStyleRewriteMutation = useCreateStyleRewrite(config);

  // Poll for style check results
  const checkQuery = useGetStyleCheck(activeCheckWorkflowId || undefined, config);

  // Poll for style rewrite results
  const rewriteQuery = useGetStyleRewrite(activeRewriteWorkflowId || undefined, config);

  // Convert new API response to old format
  const constants: Constants | null = constantsData
    ? {
        dialects: constantsData.dialects || [],
        tones: constantsData.tones || [],
        style_guides: constantsData.style_guides || {},
      }
    : null;

  const styleGuides: StyleGuides | null = styleGuidesData || null;

  // Watch for check query completion
  useEffect(() => {
    if (checkQuery.data && checkQuery.data.workflow.status === WorkflowStatus.COMPLETED) {
      checkResultRef.current = checkQuery.data;
      checkFailedRef.current = false;
      setActiveCheckWorkflowId(null);
    } else if (checkQuery.data && checkQuery.data.workflow.status === WorkflowStatus.FAILED) {
      checkResultRef.current = null;
      checkFailedRef.current = true;
      setActiveCheckWorkflowId(null);
    }
  }, [checkQuery.data, activeCheckWorkflowId]);

  // Watch for rewrite query completion
  useEffect(() => {
    if (rewriteQuery.data && rewriteQuery.data.workflow.status === WorkflowStatus.COMPLETED) {
      rewriteResultRef.current = rewriteQuery.data;
      rewriteFailedRef.current = false;
      setActiveRewriteWorkflowId(null);
    } else if (rewriteQuery.data && rewriteQuery.data.workflow.status === WorkflowStatus.FAILED) {
      rewriteResultRef.current = null;
      rewriteFailedRef.current = true;
      setActiveRewriteWorkflowId(null);
    }
  }, [rewriteQuery.data, activeRewriteWorkflowId]);

  // Simple async functions that use React Query internally
  const checkContent = useCallback(
    async (content: string): Promise<StyleCheckResponse> => {
      validateConfig(config);

      try {
        const fileBlob = createContentBlob(content);
        const result = await createStyleCheckMutation.mutateAsync({
          body: {
            file_upload: fileBlob,
            dialect: (config.dialect as Dialects | undefined) || Dialects.AMERICAN_ENGLISH,
            tone: (config.tone as Tones | undefined) || null,
            style_guide: config.styleGuide || "",
          },
        });

        // Set the workflow ID for polling
        setActiveCheckWorkflowId(result.workflow_id);
        checkResultRef.current = null; // Reset ref
        checkFailedRef.current = false;

        // Wait for the workflow to complete
        return await pollWorkflowCompletion(checkResultRef, checkFailedRef, () => {
          setActiveCheckWorkflowId(null);
        });
      } catch (error) {
        console.error("Error checking content:", error);
        throw error;
      }
    },
    [config, createStyleCheckMutation],
  );

  const contentRewrite = useCallback(
    async (content: string): Promise<RewriteResponse> => {
      validateConfig(config);

      try {
        const fileBlob = createContentBlob(content);
        const requestBody = {
          file_upload: fileBlob,
          dialect: (config.dialect as Dialects | undefined) || Dialects.AMERICAN_ENGLISH,
          tone: (config.tone as Tones | undefined) || null,
          style_guide: config.styleGuide || "",
        };

        const result = await createStyleRewriteMutation.mutateAsync({
          body: requestBody,
        });

        // Set the workflow ID for polling
        setActiveRewriteWorkflowId(result.workflow_id);
        rewriteResultRef.current = null; // Reset ref
        rewriteFailedRef.current = false;

        // Wait for the workflow to complete
        return await pollWorkflowCompletion(rewriteResultRef, rewriteFailedRef, () => {
          setActiveRewriteWorkflowId(null);
        });
      } catch (error) {
        console.error("Error rewriting content:", error);
        throw error;
      }
    },
    [config, createStyleRewriteMutation],
  );

  const fetchAdminConstants = useCallback((): Promise<Constants> => {
    return new Promise((resolve, reject) => {
      try {
        validateConfig(config);

        if (constantsError) {
          reject(
            constantsError instanceof Error
              ? constantsError
              : new Error("Failed to load constants"),
          );
          return;
        }

        if (!constants) {
          reject(new Error("Constants not loaded"));
          return;
        }

        resolve(constants);
      } catch (error: unknown) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }, [config, constants, constantsError]);

  const fetchStyleGuides = useCallback((): Promise<StyleGuides> => {
    return new Promise((resolve, reject) => {
      try {
        validateConfig(config);

        if (styleGuidesError) {
          reject(
            styleGuidesError instanceof Error
              ? styleGuidesError
              : new Error("Failed to load style guides"),
          );
          return;
        }

        if (!styleGuides) {
          reject(new Error("Style guides not loaded"));
          return;
        }

        resolve(styleGuides);
      } catch (error: unknown) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }, [config, styleGuides, styleGuidesError]);

  return {
    // Data
    constants,
    styleGuides,
    constantsLoading,
    styleGuidesLoading,
    constantsError,
    styleGuidesError,

    // Functions (same interface as before)
    checkContent,
    contentRewrite,
    fetchAdminConstants,
    fetchStyleGuides,
  };
}
