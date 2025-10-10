'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import {
  internalGetAdminConstantsOptions,
  styleGuidesListStyleGuidesOptions,
  styleRewritesCreateStyleRewriteMutation,
  styleRewritesGetStyleRewriteOptions,
  styleChecksCreateStyleCheckMutation,
  styleChecksGetStyleCheckOptions,
} from '../api-client/@tanstack/react-query.gen';

// Types are inferred from generated helpers; no explicit typings needed here.
import { useApiClient } from './useApiClient';
import type { PlatformConfig } from '../types/content';

export function useGetAdminConstants(config?: PlatformConfig) {
  const client = useApiClient(config);
  return useQuery({
    ...internalGetAdminConstantsOptions({ client }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useListStyleGuides(config?: PlatformConfig) {
  const client = useApiClient(config);
  return useQuery({
    ...styleGuidesListStyleGuidesOptions({ client }),
    staleTime: 60 * 1000,
  });
}

export function useCreateStyleRewrite(config?: PlatformConfig) {
  const client = useApiClient(config);
  return useMutation({
    ...styleRewritesCreateStyleRewriteMutation({ client }),
    onError: (error) => {
      console.error('Style rewrite error:', error);
    },
  });
}

export function useGetStyleRewrite(workflowId?: string, config?: PlatformConfig) {
  const client = useApiClient(config);
  return useQuery({
    ...styleRewritesGetStyleRewriteOptions({
      client,
      path: { workflow_id: workflowId || '' },
    }),
    enabled: !!workflowId,
    refetchInterval: (query) => {
      const data = query.state.data as { workflow?: { status?: string } } | undefined;
      const status = data?.workflow?.status ? String(data.workflow.status).toLowerCase() : undefined;
      return status === 'running' ? 2000 : false;
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
      console.error('Style suggestion error:', error);
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
      path: { workflow_id: workflowId || '' },
    }),
    enabled: !!workflowId,
    refetchInterval: (query) => {
      const data = query.state.data as { workflow?: { status?: string } } | undefined;
      const status = data?.workflow?.status ? String(data.workflow.status).toLowerCase() : undefined;
      return status === 'running' ? 2000 : false;
    },
    refetchIntervalInBackground: true,
  });
}
