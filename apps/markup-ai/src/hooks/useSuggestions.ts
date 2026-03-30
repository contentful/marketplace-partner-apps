import { useState, useEffect, useCallback, useRef } from "react";
import { useCreateStyleSuggestionMutation, useGetStyleSuggestion } from "./useStyleAndBrandAgent";
import type { SuggestionResponse } from "../api-client/types.gen";
import type { PlatformConfig } from "../types/content";
import { Dialects, Tones, WorkflowStatus } from "../api-client/types.gen";
import { WORKFLOW_POLLING_INTERVAL, WORKFLOW_TIMEOUT } from "../constants/app";
import { createContentBlob } from "../utils/htmlUtils";

// Validate config
const validateConfig = (config: PlatformConfig) => {
  if (!config.apiKey) {
    throw new Error("API key is required");
  }
};

// Polling helper
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

export function useSuggestions(config: PlatformConfig) {
  const [activeSuggestionWorkflowId, setActiveSuggestionWorkflowId] = useState<string | null>(null);
  const [lastWorkflowId, setLastWorkflowId] = useState<string | null>(null);
  const suggestionResultRef = useRef<SuggestionResponse | null>(null);
  const suggestionFailedRef = useRef<boolean>(false);

  // Create suggestion mutation
  const createSuggestionMutation = useCreateStyleSuggestionMutation(config);

  // Poll for suggestion results
  const suggestionQuery = useGetStyleSuggestion(activeSuggestionWorkflowId || undefined, config);

  // Watch for suggestion query completion
  useEffect(() => {
    if (!suggestionQuery.data || !activeSuggestionWorkflowId) return;

    if (suggestionQuery.data.workflow.status === WorkflowStatus.COMPLETED) {
      // Set ref BEFORE clearing workflow ID to ensure pollWorkflowCompletion can detect it
      suggestionResultRef.current = suggestionQuery.data;
      suggestionFailedRef.current = false;
      // Save the completed workflow ID for reference
      setLastWorkflowId(suggestionQuery.data.workflow.id);
      // Small delay to ensure the ref is read by polling interval
      setTimeout(() => {
        setActiveSuggestionWorkflowId(null);
      }, 100);
    } else if (suggestionQuery.data.workflow.status === WorkflowStatus.FAILED) {
      suggestionResultRef.current = null;
      suggestionFailedRef.current = true;
      setTimeout(() => {
        setActiveSuggestionWorkflowId(null);
      }, 100);
    }
  }, [suggestionQuery.data, activeSuggestionWorkflowId]);

  const getSuggestions = useCallback(
    async (content: string, isHtml?: boolean): Promise<SuggestionResponse> => {
      validateConfig(config);

      try {
        const fileBlob = createContentBlob(content, isHtml);
        const result = await createSuggestionMutation.mutateAsync({
          body: {
            file_upload: fileBlob,
            dialect: (config.dialect as Dialects | undefined) || Dialects.AMERICAN_ENGLISH,
            tone: (config.tone as Tones | undefined) || null,
            style_guide: config.styleGuide || "",
          },
        });

        if (!result.workflow_id) {
          throw new Error("No workflow ID returned from suggestions API");
        }

        // Set the workflow ID for polling
        setActiveSuggestionWorkflowId(result.workflow_id);
        suggestionResultRef.current = null; // Reset ref
        suggestionFailedRef.current = false;

        // Wait for the workflow to complete
        return await pollWorkflowCompletion(suggestionResultRef, suggestionFailedRef, () => {
          setActiveSuggestionWorkflowId(null);
        });
      } catch (error) {
        console.error("Error getting suggestions:", error);
        throw error;
      }
    },
    [config, createSuggestionMutation],
  );

  return {
    getSuggestions,
    isPolling: activeSuggestionWorkflowId !== null,
    lastWorkflowId,
  };
}
