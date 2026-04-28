"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import {
  getAdminConstantsOptions,
  styleGuidesListStyleGuidesOptions,
  styleRewritesCreateStyleRewriteMutation,
  styleRewritesGetStyleRewriteOptions,
  styleChecksCreateStyleCheckMutation,
  styleChecksGetStyleCheckOptions,
  styleSuggestionsCreateStyleSuggestionMutation,
  styleSuggestionsGetStyleSuggestionOptions,
} from "../api-client/@tanstack/react-query.gen";

// Types are inferred from generated helpers; no explicit typings needed here.
import { useApiClient } from "./useApiClient";
import type { PlatformConfig } from "../types/content";

export function useGetAdminConstants(config?: PlatformConfig) {
  const client = useApiClient(config);
  const enabled = Boolean(config?.apiKey);
  return useQuery({
    ...getAdminConstantsOptions({ client }),
    staleTime: 5 * 60 * 1_000,
    enabled,
  });
}

export function useListStyleGuides(config?: PlatformConfig) {
  const client = useApiClient(config);
  const enabled = Boolean(config?.apiKey);
  return useQuery({
    ...styleGuidesListStyleGuidesOptions({ client }),
    staleTime: 60 * 1_000,
    enabled,
  });
}

export function useCreateStyleRewrite(config?: PlatformConfig) {
  const client = useApiClient(config);
  return useMutation({
    ...styleRewritesCreateStyleRewriteMutation({ client }),
    onError: (error) => {
      console.error("Style rewrite error:", error);
    },
  });
}

export function useGetStyleRewrite(workflowId?: string, config?: PlatformConfig) {
  const client = useApiClient(config);
  return useQuery({
    ...styleRewritesGetStyleRewriteOptions({
      client,
      path: { workflow_id: workflowId || "" },
    }),
    enabled: !!workflowId,
    refetchInterval: (data) => {
      const response = data as { workflow?: { status?: string } } | undefined;
      const status = response?.workflow?.status
        ? response.workflow.status.toLowerCase()
        : undefined;
      return status === "running" ? 2_000 : false;
    },
    refetchIntervalInBackground: true,
  });
}

// Style Suggestions (alias for style check)
export function useCreateStyleSuggestion(config?: PlatformConfig) {
  const client = useApiClient(config);
  return useMutation({
    ...styleChecksCreateStyleCheckMutation({ client }),
    onError: (error) => {
      console.error("Style suggestion error:", error);
    },
  });
}

// Alias for style check
export function useCreateStyleCheck(config?: PlatformConfig) {
  return useCreateStyleSuggestion(config);
}

export function useGetStyleCheck(workflowId?: string, config?: PlatformConfig) {
  const client = useApiClient(config);
  return useQuery({
    ...styleChecksGetStyleCheckOptions({
      client,
      path: { workflow_id: workflowId || "" },
    }),
    enabled: !!workflowId,
    refetchInterval: (data) => {
      const response = data as { workflow?: { status?: string } } | undefined;
      const status = response?.workflow?.status
        ? response.workflow.status.toLowerCase()
        : undefined;
      return status === "running" ? 2_000 : false;
    },
    refetchIntervalInBackground: true,
  });
}

// Style Suggestions
export function useCreateStyleSuggestionMutation(config?: PlatformConfig) {
  const client = useApiClient(config);
  return useMutation({
    ...styleSuggestionsCreateStyleSuggestionMutation({ client }),
    onError: (error) => {
      console.error("Style suggestion error:", error);
    },
  });
}

export function useGetStyleSuggestion(workflowId?: string, config?: PlatformConfig) {
  const client = useApiClient(config);
  return useQuery({
    ...styleSuggestionsGetStyleSuggestionOptions({
      client,
      path: { workflow_id: workflowId || "" },
    }),
    enabled: !!workflowId,
    refetchInterval: (data) => {
      const response = data as { workflow?: { status?: string } } | undefined;
      const status = response?.workflow?.status
        ? response.workflow.status.toLowerCase()
        : undefined;
      return status === "running" ? 2000 : false;
    },
    refetchIntervalInBackground: true,
  });
}
