/**
 * Service for fetching application configuration from the API
 */

import { AUTH0_PROD_DEFAULTS } from "../constants/authConstants";

export interface Auth0Config {
  domain: string;
  clientId: string;
  audience: string;
}

export interface AppConfig {
  auth0: Auth0Config;
}

/**
 * Fetches the application configuration from the API
 * For now, uses environment variables as fallback since API is not live yet
 * @returns Promise<AppConfig> - The application configuration
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function fetchAppConfig(): Promise<AppConfig> {
  try {
    // Use environment variables with production defaults as fallback
    const domain = String(import.meta.env.VITE_AUTH0_DOMAIN || AUTH0_PROD_DEFAULTS.domain);
    const clientId = String(import.meta.env.VITE_AUTH0_CLIENT_ID || AUTH0_PROD_DEFAULTS.clientId);
    const audience = String(import.meta.env.VITE_AUTH0_AUDIENCE || AUTH0_PROD_DEFAULTS.audience);

    const config: AppConfig = {
      auth0: {
        domain,
        clientId,
        audience,
      },
    };

    console.log("[ConfigService] Using environment variables for Auth0 config");
    return config;
  } catch (error) {
    console.error("[ConfigService] Failed to fetch app config:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Gets the base URL for the API based on environment variables
 * This reuses the same logic as useApiClient
 */
export function getApiBaseUrl(): string {
  // VITE_MARKUPAI_URL takes precedence when set
  if (import.meta.env.VITE_MARKUPAI_URL) {
    return String(import.meta.env.VITE_MARKUPAI_URL);
  }

  // Environment URLs mapping
  const ENVIRONMENT_URLS = {
    dev: "https://api.dev.markup.ai",
    stage: "https://api.stg.markup.ai",
    prod: "https://api.markup.ai",
  } as const;

  type Environment = keyof typeof ENVIRONMENT_URLS;

  // Use VITE_MARKUPAI_ENV to select environment (defaults to 'prod')
  const envValue = import.meta.env.VITE_MARKUPAI_ENV as string | undefined;
  const env: Environment =
    envValue && envValue in ENVIRONMENT_URLS ? (envValue as Environment) : "prod";
  return ENVIRONMENT_URLS[env];
}
