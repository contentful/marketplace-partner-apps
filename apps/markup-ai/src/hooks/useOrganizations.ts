import { useQuery } from "@tanstack/react-query";
import { authenticationGetUserOrganizations } from "../api-client/sdk.gen";
import type { HeliosOneApiModulesAuthMainOrganization } from "../api-client/types.gen";
import { useApiClient } from "./useApiClient";
import { useAuth } from "../contexts/AuthContext";
import { fingerprintApiKey } from "../utils/styleTargetsCache";

export type Organization = HeliosOneApiModulesAuthMainOrganization;

export interface UseOrganizationsResult {
  organizations: Organization[];
  isLoading: boolean;
  isError: boolean;
}

/**
 * Fetches the Auth0 organizations the authenticated user belongs to
 * (`GET /auth/organizations`), each with `display_name` + `picture` (logo).
 * Powers the OrganizationSwitcher's list. Same auth gating and
 * token-fingerprinted query key as `useAccount` / `useAccountConfig`.
 */
export function useOrganizations(): UseOrganizationsResult {
  const { isAuthenticated, token } = useAuth();
  const client = useApiClient({ apiKey: token ?? "" });

  const apiKeyFp = token ? fingerprintApiKey(token) : "anonymous";
  const enabled = isAuthenticated && Boolean(token);

  const query = useQuery<Organization[]>({
    queryKey: ["authenticationGetUserOrganizations", apiKeyFp],
    queryFn: async ({ signal }) => {
      const { data } = await authenticationGetUserOrganizations({
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
    organizations: query.data ?? [],
    isLoading: query.isLoading && enabled,
    isError: query.isError,
  };
}
