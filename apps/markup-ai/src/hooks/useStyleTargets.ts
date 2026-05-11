import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { internalListTargets } from "../api-client/sdk.gen";
import type { TargetResponse } from "../api-client/types.gen";
import { useApiClient } from "./useApiClient";
import {
  fingerprintApiKey,
  readStyleTargetsCache,
  writeStyleTargetsCache,
} from "../utils/styleTargetsCache";

export interface UseStyleTargetsResult {
  targets: TargetResponse[];
  isLoading: boolean;
  isError: boolean;
  defaultTargetId: string | null;
}

const STYLE_TARGETS_QUERY_PREFIX = "internalListTargets";

/**
 * Fetches the list of style guides ("targets") for the authenticated user.
 *
 * Crucially, results are cached in localStorage for 5 minutes. Each
 * Markup AI-enabled field on the entry editor renders inside its own
 * iframe with its own React Query cache, so without this layer N enabled
 * fields → N network calls per page load. localStorage is shared across
 * same-origin iframes, so the first iframe's response is reused by the
 * rest until the TTL expires.
 *
 * The react-query cache key includes a fingerprint of the api key so a
 * within-iframe account switch can never serve the previous user's
 * targets — the generated query key keys only on baseUrl, which would
 * leak across users otherwise.
 */
export function useStyleTargets(apiKey?: string | null): UseStyleTargetsResult {
  const client = useApiClient({ apiKey: apiKey ?? "" });

  // `undefined` is the "not yet read" sentinel; `null` means "read and the
  // cache was empty". Without the distinct sentinel, `??=` would re-read
  // localStorage on every render after a cache miss.
  const cachedRef = useRef<TargetResponse[] | null | undefined>(undefined);
  // Re-read the cache when `apiKey` changes — otherwise an in-iframe account
  // switch (sign-out + sign-in as a different user via the cross-location
  // auth sync) would keep showing the previous account's targets, and the
  // `enabled: !cached` short-circuit would block the refetch.
  const lastApiKeyRef = useRef<string | null | undefined>(undefined);
  if (cachedRef.current === undefined || lastApiKeyRef.current !== apiKey) {
    lastApiKeyRef.current = apiKey;
    cachedRef.current = readStyleTargetsCache(apiKey);
  }
  const cached = cachedRef.current;

  const apiKeyFp = apiKey ? fingerprintApiKey(apiKey) : "anonymous";

  const query = useQuery<TargetResponse[]>({
    queryKey: [STYLE_TARGETS_QUERY_PREFIX, apiKeyFp],
    queryFn: async ({ signal }) => {
      const { data } = await internalListTargets({ client, signal, throwOnError: true });
      return data;
    },
    enabled: Boolean(apiKey) && !cached,
    staleTime: 5 * 60 * 1000,
    initialData: cached ?? undefined,
  });

  // Persist freshly-fetched data so other iframes can skip the network call.
  // We DO cache empty arrays — accounts that legitimately have zero style
  // guides should also benefit from the dedupe; the TTL handles refresh.
  useEffect(() => {
    if (!apiKey) return;
    if (!query.data) return;
    if (cached === query.data) return;
    writeStyleTargetsCache(apiKey, query.data);
  }, [apiKey, query.data, cached]);

  const targets: TargetResponse[] = query.data ?? [];

  const defaultTargetId = useMemo(
    () => targets.find((t) => t.is_default)?.id ?? targets.find((t) => t.enabled)?.id ?? null,
    [targets],
  );

  return {
    targets,
    isLoading: query.isLoading && !cached,
    isError: query.isError,
    defaultTargetId,
  };
}
