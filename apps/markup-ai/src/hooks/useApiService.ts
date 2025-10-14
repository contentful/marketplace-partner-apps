import { useCallback, useState, useEffect, useRef } from 'react';
import {
  useGetAdminConstants,
  useListStyleGuides,
  useCreateStyleCheck,
  useGetStyleCheck,
  useCreateStyleRewrite,
  useGetStyleRewrite,
} from './useStyleAndBrandAgent';
import type { PlatformConfig } from '../types/content';
import { Dialects, RewriteResponse, StyleCheckResponse, Tones } from '../api-client/types.gen';
import { isLikelyHtmlString, isLikelyMarkdownString } from '../utils/contentDetection';

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

export function validateConfig(config: PlatformConfig | undefined): asserts config is PlatformConfig {
  if (!config?.apiKey) {
    throw new Error('Configuration is missing. Please configure the app first.');
  }
}

// Helper function to create a Blob from string content
const createContentBlob = (content: string): File => {
  let mimeType = 'text/plain';
  let extension = '.txt';

  if (isLikelyHtmlString(content)) {
    mimeType = 'text/html';
    extension = '.html';
  } else if (isLikelyMarkdownString(content)) {
    mimeType = 'text/markdown';
    extension = '.md';
  }

  return new File([content], `content${extension}`, { type: mimeType });
};

// Hook-based service that uses React Query internally
export function useApiService(config: PlatformConfig) {
  const [activeCheckWorkflowId, setActiveCheckWorkflowId] = useState<string | null>(null);
  const [activeRewriteWorkflowId, setActiveRewriteWorkflowId] = useState<string | null>(null);

  // Use refs to track current results for the polling logic
  const checkResultRef = useRef<StyleCheckResponse | null>(null);
  const rewriteResultRef = useRef<RewriteResponse | null>(null);

  // Get admin constants
  const { data: constantsData, isLoading: constantsLoading, error: constantsError } = useGetAdminConstants(config);

  // Get style guides
  const { data: styleGuidesData, isLoading: styleGuidesLoading, error: styleGuidesError } = useListStyleGuides(config);

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
    if (checkQuery.data && checkQuery.data.workflow?.status === 'completed') {
      checkResultRef.current = checkQuery.data;
    } else if (checkQuery.data && checkQuery.data.workflow?.status === 'failed') {
      checkResultRef.current = null;
    }
  }, [checkQuery.data, activeCheckWorkflowId]);

  // Watch for rewrite query completion
  useEffect(() => {
    if (rewriteQuery.data && rewriteQuery.data.workflow?.status === 'completed') {
      rewriteResultRef.current = rewriteQuery.data;
    } else if (rewriteQuery.data && rewriteQuery.data.workflow?.status === 'failed') {
      rewriteResultRef.current = null;
    }
  }, [rewriteQuery.data]);

  // Simple async functions that use React Query internally
  const checkContent = useCallback(
    async (content: string): Promise<StyleCheckResponse> => {
      validateConfig(config);

      try {
        const fileBlob = createContentBlob(content);
        const result = await createStyleCheckMutation.mutateAsync({
          body: {
            file_upload: fileBlob,
            dialect: (config.dialect as Dialects) || Dialects.AMERICAN_ENGLISH,
            tone: (config.tone as Tones) || null,
            style_guide: config.styleGuide || '',
          },
        });

        // Set the workflow ID for polling
        setActiveCheckWorkflowId(result.workflow_id);
        checkResultRef.current = null; // Reset ref

        // Wait for the workflow to complete
        return new Promise((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (checkResultRef.current) {
              clearInterval(checkInterval);
              resolve(checkResultRef.current);
            }
          }, 1000); // Check every second

          // Timeout after 1 minute
          setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Workflow timed out'));
          }, 60000);
        });
      } catch (error) {
        console.error('Error checking content:', error);
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
        const result = await createStyleRewriteMutation.mutateAsync({
          body: {
            file_upload: fileBlob,
            dialect: (config.dialect as Dialects) || Dialects.AMERICAN_ENGLISH,
            tone: (config.tone as Tones) || null,
            style_guide: config.styleGuide || '',
          },
        });

        // Set the workflow ID for polling
        setActiveRewriteWorkflowId(result.workflow_id);
        rewriteResultRef.current = null; // Reset ref

        // Wait for the workflow to complete
        return new Promise((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (rewriteResultRef.current) {
              clearInterval(checkInterval);
              resolve(rewriteResultRef.current);
            }
          }, 1000); // Check every second

          // Timeout after 1 minute
          setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Workflow timed out'));
          }, 60000);
        });
      } catch (error) {
        console.error('Error rewriting content:', error);
        throw error;
      }
    },
    [config, createStyleRewriteMutation],
  );

  const fetchAdminConstants = useCallback(async (): Promise<Constants> => {
    validateConfig(config);

    if (constantsError) {
      throw constantsError;
    }

    if (!constants) {
      throw new Error('Constants not loaded');
    }

    return constants;
  }, [config, constants, constantsError]);

  const fetchStyleGuides = useCallback(async (): Promise<StyleGuides> => {
    validateConfig(config);

    if (styleGuidesError) {
      throw styleGuidesError;
    }

    if (!styleGuides) {
      throw new Error('Style guides not loaded');
    }

    return styleGuides;
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
