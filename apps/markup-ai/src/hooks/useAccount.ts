import { useQuery } from "@tanstack/react-query";
import { accountGetAccount } from "../api-client/sdk.gen";
import type { AccountResponse, OrganizationResponseFull } from "../api-client/types.gen";
import { useApiClient } from "./useApiClient";
import { useAuth } from "../contexts/AuthContext";
import { fingerprintApiKey } from "../utils/styleGuidesCache";

export interface UseAccountResult {
  account: AccountResponse | null;
  /** The signed-in user's current organization (carries a friendly `display_name`). */
  organization: OrganizationResponseFull | null;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Fetches the authenticated user's account (`GET /account`), which carries the
 * *current* organization plus a friendly `display_name`. The JWT only carries
 * the machine-readable `org_name`, so this is the source for the org label the
 * OrganizationSwitcher shows. Mirrors `useAccountConfig`: same auth gating and
 * token-fingerprinted query key so an in-session org switch can never serve
 * the previous org's account from react-query's cache.
 */
export function useAccount(): UseAccountResult {
  const { isAuthenticated, token } = useAuth();
  const client = useApiClient({ apiKey: token ?? "" });

  const apiKeyFp = token ? fingerprintApiKey(token) : "anonymous";
  const enabled = isAuthenticated && Boolean(token);

  const query = useQuery<AccountResponse>({
    queryKey: ["accountGetAccount", apiKeyFp],
    queryFn: async ({ signal }) => {
      const { data } = await accountGetAccount({ client, signal, throwOnError: true });
      return data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    account: query.data ?? null,
    organization: query.data?.organization ?? null,
    isLoading: query.isLoading && enabled,
    isError: query.isError,
  };
}
