import { useState, useEffect, useCallback } from "react";
import { fetchAppConfig, type AppConfig } from "../services/configService";

interface UseAppConfigReturn {
  config: AppConfig | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage application configuration
 */
export function useAppConfig(): UseAppConfigReturn {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const appConfig = await fetchAppConfig();

      setConfig(appConfig);
      console.log("[useAppConfig] Successfully fetched config:", {
        domain: appConfig.auth0.domain,
        clientId: appConfig.auth0.clientId,
        audience: appConfig.auth0.audience,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch configuration";
      setError(errorMessage);
      console.error("[useAppConfig] Failed to fetch config:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    isLoading,
    error,
    refetch: fetchConfig,
  };
}
