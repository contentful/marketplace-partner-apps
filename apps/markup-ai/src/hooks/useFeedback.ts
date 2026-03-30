/**
 * Hook for submitting feedback on suggestions
 */

import { useMutation } from "@tanstack/react-query";
import { internalSubmitFeedbackMutation } from "../api-client/@tanstack/react-query.gen";
import type { FeedbackRequest } from "../api-client/types.gen";
import { useApiClient } from "./useApiClient";
import type { PlatformConfig } from "../types/content";

export interface SubmitFeedbackParams {
  workflowId: string;
  requestId: string;
  helpful: boolean;
  feedback?: string;
  original?: string;
  suggestion?: string;
  category?: string;
}

export function useFeedback(config?: PlatformConfig) {
  const client = useApiClient(config);
  const mutation = useMutation(internalSubmitFeedbackMutation({ client }));

  const submitFeedback = async (params: SubmitFeedbackParams) => {
    const body: FeedbackRequest = {
      workflow_id: params.workflowId,
      request_id: params.requestId,
      helpful: params.helpful,
      feedback: params.feedback || null,
      original: params.original || null,
      suggestion: params.suggestion || null,
      category: params.category || null,
    };

    return mutation.mutateAsync({ body });
  };

  return {
    submitFeedback,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
