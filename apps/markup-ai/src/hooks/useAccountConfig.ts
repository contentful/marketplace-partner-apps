import { useQuery } from "@tanstack/react-query";
import { styleAgentGetStyleAgentConfig } from "../api-client/sdk.gen";
import type { OrganizationConfigResponse } from "../api-client/types.gen";
import { useApiClient } from "./useApiClient";
import { useAuth } from "../contexts/AuthContext";
import { fingerprintApiKey } from "../utils/styleTargetsCache";

export interface UseAccountConfigResult {
  config: OrganizationConfigResponse | null;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Org-level capability flags from `GET /style-agent/config`. The org is
 * identified by the auth credential, so we just need an authenticated
 * client; no params are passed.
 *
 * The response drives `useAgentAvailability` (which agents the user is
 * allowed to run). Org config rarely changes inside a session, so the
 * 5-minute staleTime keeps the network footprint small without needing a
 * cross-iframe localStorage layer the way `useStyleTargets` does. Add one
 * later if N field-iframes per page show up as a real cost.
 *
 * Fail-open: while loading or on error, callers see `config === null`.
 * `computeAgentAvailability(null)` returns an empty map, so a transient
 * API failure never blocks Check.
 */
export function useAccountConfig(): UseAccountConfigResult {
  const { isAuthenticated, token } = useAuth();
  const client = useApiClient({ apiKey: token ?? "" });

  // Key the query by a fingerprint of the auth token so a within-iframe
  // account/org switch (the cross-location auth sync in AuthContext) can
  // never serve user A's `/style-agent/config` to user B from react-query's
  // cache. Same pattern as `useStyleTargets`.
  const apiKeyFp = token ? fingerprintApiKey(token) : "anonymous";

  // Also gate on token presence: AuthContext's silent-restore briefly has
  // `isAuthenticated=true` before `getTokenSilently` populates `token`,
  // and firing the request in that window would build a client with an
  // empty bearer and 401 — harmless under fail-open but noisy.
  const enabled = isAuthenticated && Boolean(token);

  const query = useQuery<OrganizationConfigResponse>({
    queryKey: ["styleAgentGetStyleAgentConfig", apiKeyFp],
    queryFn: async ({ signal }) => {
      const { data } = await styleAgentGetStyleAgentConfig({
        client,
        signal,
        throwOnError: true,
      });
      return data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    config: query.data ?? null,
    isLoading: query.isLoading && enabled,
    isError: query.isError,
  };
}
