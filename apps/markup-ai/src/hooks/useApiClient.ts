"use client";

import { QueryClient } from "@tanstack/react-query";
import { createClient } from "../api-client/client";
import type { PlatformConfig } from "../types/content";

export const queryClient = new QueryClient();

// Environment URLs mapping
const ENVIRONMENT_URLS = {
  dev: "https://api.dev.markup.ai",
  stage: "https://api.stg.markup.ai",
  prod: "https://api.markup.ai",
} as const;

type Environment = keyof typeof ENVIRONMENT_URLS;

// Get the base URL based on environment variables
function getBaseUrl(): string {
  // VITE_MARKUPAI_URL takes precedence when set
  if (import.meta.env.VITE_MARKUPAI_URL) {
    return String(import.meta.env.VITE_MARKUPAI_URL);
  }

  // Use VITE_MARKUPAI_ENV to select environment (defaults to 'prod')
  const envValue = import.meta.env.VITE_MARKUPAI_ENV as string | undefined;
  const env: Environment =
    envValue && envValue in ENVIRONMENT_URLS ? (envValue as Environment) : "prod";
  return ENVIRONMENT_URLS[env];
}

export function useApiClient(config?: PlatformConfig) {
  const apiKey = config?.apiKey || "";
  const baseUrl = getBaseUrl();

  return createClient({
    baseUrl,
    auth: apiKey,
    headers: {
      "x-integration-id": "markupai-contentful-app",
    },
  });
}
