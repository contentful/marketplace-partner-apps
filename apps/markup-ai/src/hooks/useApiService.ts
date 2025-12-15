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

// Helper function to create a Blob from string content
const createContentBlob = (content: string): File => {
  let mimeType = "text/plain";
  let extension = ".txt";

  if (isLikelyHtmlString(content)) {
    mimeType = "text/html";
    extension = ".html";
  } else if (isLikelyMarkdownString(content)) {
    mimeType = "text/markdown";
    extension = ".md";
  }

  return new File([content], `content${extension}`, { type: mimeType });
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

  // eslint-disable-next-line @typescript-eslint/require-await
  const fetchAdminConstants = useCallback(async (): Promise<Constants> => {
    try {
      validateConfig(config);

      if (constantsError) {
        throw constantsError;
      }

      if (!constants) {
        throw new Error("Constants not loaded");
      }

      return constants;
    } catch (error: unknown) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }, [config, constants, constantsError]);

  // eslint-disable-next-line @typescript-eslint/require-await
  const fetchStyleGuides = useCallback(async (): Promise<StyleGuides> => {
    try {
      validateConfig(config);

      if (styleGuidesError) {
        throw styleGuidesError;
      }

      if (!styleGuides) {
        throw new Error("Style guides not loaded");
      }

      return styleGuides;
    } catch (error: unknown) {
      throw error instanceof Error ? error : new Error(String(error));
    }
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
