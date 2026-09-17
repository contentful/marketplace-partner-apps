import { useEffect, useState } from "react";
import type { AppConfig } from "./types";
import { DEFAULT_CONFIG } from "../config/defaults";
import { normalizeBaseUrl } from "../config/normalize";

type ConfigResult = {
  config: AppConfig;
  loading: boolean;
  error: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function hasInstallationParams(sdk: unknown): sdk is { parameters: { installation?: unknown } } {
  if (!isRecord(sdk)) return false;

  const parameters = sdk["parameters"];
  if (!isRecord(parameters)) return false;

  return "installation" in parameters;
}

function hasGetParameters(sdk: unknown): sdk is { app: { getParameters: () => Promise<unknown> } } {
  if (!isRecord(sdk)) return false;

  const app = sdk["app"];
  if (!isRecord(app)) return false;

  return typeof app["getParameters"] === "function";
}

export function useAppConfig(sdk: unknown): ConfigResult {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        let params: Partial<AppConfig> | null = null;

        if (hasInstallationParams(sdk)) {
          const installation = sdk.parameters.installation;
          params = isRecord(installation) ? (installation as Partial<AppConfig>) : null;
        } else if (hasGetParameters(sdk)) {
          params = (await sdk.app.getParameters()) as Partial<AppConfig> | null;
        } else {
          throw new Error(
            "Unable to read installation parameters. Expected sdk.parameters.installation (preferred) or sdk.app.getParameters().",
          );
        }

        const next: AppConfig = {
          ...DEFAULT_CONFIG,
          ...(params ?? {}),
          baseUrl: normalizeBaseUrl(String(params?.baseUrl ?? DEFAULT_CONFIG.baseUrl)),
          detectOrphans: params?.detectOrphans !== false,
        };

        if (mounted) setConfig(next);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load app configuration.";
        if (mounted) setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [sdk]);

  return { config, loading, error };
}
