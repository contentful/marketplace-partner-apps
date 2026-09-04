import type { AppConfig } from "../core/types";
import { DEFAULT_CONFIG } from "./defaults";
import { normalizeBaseUrl } from "./normalize";

type SdkWithAppParams = {
  app: {
    getParameters: () => Promise<unknown>;
  };
};

export async function getConfig(sdk: SdkWithAppParams): Promise<AppConfig> {
  const params = (await sdk.app.getParameters()) as Partial<AppConfig> | null;

  const cfg: AppConfig = {
    ...DEFAULT_CONFIG,
    ...(params ?? {}),
    baseUrl: normalizeBaseUrl((params?.baseUrl ?? DEFAULT_CONFIG.baseUrl) as string),
    detectOrphans: params?.detectOrphans !== false,
  };

  // Hard guard: sources must exist
  if (!Array.isArray(cfg.sources)) cfg.sources = [];

  return cfg;
}
