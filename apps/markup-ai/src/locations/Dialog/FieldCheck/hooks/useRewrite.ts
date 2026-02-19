/**
 * Hook for managing rewrite API calls and workflow polling
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialects,
  WorkflowStatus,
  type RewriteResponse,
  type StyleRewriteRequestBody,
} from "../../../../api-client/types.gen";
import { useCreateStyleRewrite, useGetStyleRewrite } from "../../../../hooks/useStyleAndBrandAgent";
import { extractWorkflowStatus } from "../utils/typeUtils";
import type { ConfigValues } from "./useFieldCheckState";

export interface UseRewriteResult {
  getRewrite: (content: string, isHtml?: boolean) => Promise<RewriteResponse | null>;
  rewriteResult: RewriteResponse | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for handling rewrite operations with workflow polling
 */
export function useRewrite(config: ConfigValues): UseRewriteResult {
  const [rewriteWorkflowId, setRewriteWorkflowId] = useState<string | null>(null);
  const [rewriteResult, setRewriteResult] = useState<RewriteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rewriteResultRef = useRef(false);
  const rewriteFailedRef = useRef(false);

  const createRewriteMutation = useCreateStyleRewrite();
  const rewriteQuery = useGetStyleRewrite(rewriteWorkflowId || undefined);

  // Watch for rewrite completion
  useEffect(() => {
    if (!rewriteQuery.data) return;

    const workflow = rewriteQuery.data.workflow;
    const status = workflow.status;

    if (status === WorkflowStatus.COMPLETED) {
      if (!rewriteResultRef.current) {
        rewriteResultRef.current = true;
        setRewriteResult(rewriteQuery.data);
      }
    } else if (status === WorkflowStatus.FAILED) {
      if (!rewriteFailedRef.current) {
        rewriteFailedRef.current = true;
        setError("Rewrite failed. Please try again.");
      }
    }
  }, [rewriteQuery.data]);

  // Reset refs when starting a new rewrite
  useEffect(() => {
    if (rewriteWorkflowId) {
      rewriteResultRef.current = false;
      rewriteFailedRef.current = false;
    }
  }, [rewriteWorkflowId]);

  const getRewrite = useCallback(
    async (content: string, isHtml?: boolean): Promise<RewriteResponse | null> => {
      setError(null);
      setRewriteResult(null);
      rewriteResultRef.current = false;
      rewriteFailedRef.current = false;

      try {
        // Create a File object from the content with appropriate extension
        const mimeType = isHtml ? "text/html" : "text/plain";
        const extension = isHtml ? ".html" : ".txt";
        const blob = new Blob([content], { type: mimeType });
        const file = new File([blob], `content${extension}`, { type: mimeType });

        const requestBody: StyleRewriteRequestBody = {
          file_upload: file,
          dialect: config.dialect || Dialects.AMERICAN_ENGLISH,
          tone: config.tone || null,
          style_guide: config.styleGuide || "ap",
        };

        const response = await createRewriteMutation.mutateAsync({
          body: requestBody,
        });

        setRewriteWorkflowId(response.workflow_id);

        // Poll until completion
        return await new Promise((resolve, reject) => {
          const pollInterval = setInterval(() => {
            if (rewriteResultRef.current && rewriteQuery.data) {
              clearInterval(pollInterval);
              clearTimeout(timeoutId);
              resolve(rewriteQuery.data);
            } else if (rewriteFailedRef.current) {
              clearInterval(pollInterval);
              clearTimeout(timeoutId);
              reject(new Error("Rewrite workflow failed"));
            }
          }, 500);

          // Timeout after 2 minutes
          const timeoutId = setTimeout(() => {
            if (!rewriteResultRef.current) {
              clearInterval(pollInterval);
              reject(new Error("Rewrite workflow timed out"));
            }
          }, 120000);
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Rewrite failed";
        setError(errorMessage);
        console.error("Error in getRewrite:", err);
        return null;
      }
    },
    [config, createRewriteMutation, rewriteQuery.data],
  );

  const isLoading =
    createRewriteMutation.isPending ||
    (!!rewriteWorkflowId &&
      (!rewriteQuery.data || extractWorkflowStatus(rewriteQuery.data) === "running"));

  return {
    getRewrite,
    rewriteResult,
    isLoading,
    error,
  };
}
