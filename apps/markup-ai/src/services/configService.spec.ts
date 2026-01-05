import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AUTH0_PROD_DEFAULTS } from "../constants/authConstants";

describe("configService", () => {
  let fetchAppConfig: typeof import("./configService").fetchAppConfig;
  let getApiBaseUrl: typeof import("./configService").getApiBaseUrl;

  // Helper to set up environment and import module
  const setupEnvAndImport = async (envVars: Record<string, string>) => {
    for (const [key, value] of Object.entries(envVars)) {
      vi.stubEnv(key, value);
    }
    const configService = await import("./configService");
    fetchAppConfig = configService.fetchAppConfig;
    getApiBaseUrl = configService.getApiBaseUrl;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe("fetchAppConfig", () => {
    it("should return valid app config from environment variables", async () => {
      await setupEnvAndImport({
        VITE_AUTH0_DOMAIN: "test-domain.auth0.com",
        VITE_AUTH0_CLIENT_ID: "test-client-id",
        VITE_AUTH0_AUDIENCE: "test-audience",
      });

      const result = await fetchAppConfig();

      expect(result).toEqual({
        auth0: {
          domain: "test-domain.auth0.com",
          clientId: "test-client-id",
          audience: "test-audience",
        },
      });
      expect(console.log).toHaveBeenCalledWith(
        "[ConfigService] Using environment variables for Auth0 config",
      );
    });

    it("should use production default for domain when empty", async () => {
      await setupEnvAndImport({
        VITE_AUTH0_DOMAIN: "",
        VITE_AUTH0_CLIENT_ID: "test-client-id",
        VITE_AUTH0_AUDIENCE: "test-audience",
      });

      const result = await fetchAppConfig();

      expect(result).toEqual({
        auth0: {
          domain: AUTH0_PROD_DEFAULTS.domain,
          clientId: "test-client-id",
          audience: "test-audience",
        },
      });
    });

    it("should use production default for clientId when empty", async () => {
      await setupEnvAndImport({
        VITE_AUTH0_DOMAIN: "test-domain.auth0.com",
        VITE_AUTH0_CLIENT_ID: "",
        VITE_AUTH0_AUDIENCE: "test-audience",
      });

      const result = await fetchAppConfig();

      expect(result).toEqual({
        auth0: {
          domain: "test-domain.auth0.com",
          clientId: AUTH0_PROD_DEFAULTS.clientId,
          audience: "test-audience",
        },
      });
    });

    it("should use production default for audience when empty", async () => {
      await setupEnvAndImport({
        VITE_AUTH0_DOMAIN: "test-domain.auth0.com",
        VITE_AUTH0_CLIENT_ID: "test-client-id",
        VITE_AUTH0_AUDIENCE: "",
      });

      const result = await fetchAppConfig();

      expect(result).toEqual({
        auth0: {
          domain: "test-domain.auth0.com",
          clientId: "test-client-id",
          audience: AUTH0_PROD_DEFAULTS.audience,
        },
      });
    });

    it("should use all production defaults when all values are empty", async () => {
      await setupEnvAndImport({
        VITE_AUTH0_DOMAIN: "",
        VITE_AUTH0_CLIENT_ID: "",
        VITE_AUTH0_AUDIENCE: "",
      });

      const result = await fetchAppConfig();

      expect(result).toEqual({
        auth0: {
          domain: AUTH0_PROD_DEFAULTS.domain,
          clientId: AUTH0_PROD_DEFAULTS.clientId,
          audience: AUTH0_PROD_DEFAULTS.audience,
        },
      });
    });

    it("should use production defaults when environment variables are undefined", async () => {
      // Explicitly stub with undefined to ensure no values from previous tests
      vi.stubEnv("VITE_AUTH0_DOMAIN", undefined);
      vi.stubEnv("VITE_AUTH0_CLIENT_ID", undefined);
      vi.stubEnv("VITE_AUTH0_AUDIENCE", undefined);

      const configService = await import("./configService");
      fetchAppConfig = configService.fetchAppConfig;

      const result = await fetchAppConfig();

      expect(result).toEqual({
        auth0: {
          domain: AUTH0_PROD_DEFAULTS.domain,
          clientId: AUTH0_PROD_DEFAULTS.clientId,
          audience: AUTH0_PROD_DEFAULTS.audience,
        },
      });
    });
  });

  describe("getApiBaseUrl", () => {
    it("should return VITE_MARKUPAI_URL when set", async () => {
      await setupEnvAndImport({
        VITE_MARKUPAI_URL: "https://custom.api.com",
        VITE_MARKUPAI_ENV: "dev",
      });

      expect(getApiBaseUrl()).toBe("https://custom.api.com");
    });

    it.each([
      { env: "dev", expected: "https://api.dev.markup.ai" },
      { env: "stage", expected: "https://api.stg.markup.ai" },
      { env: "prod", expected: "https://api.markup.ai" },
    ])("should return $expected when VITE_MARKUPAI_ENV is $env", async ({ env, expected }) => {
      await setupEnvAndImport({
        VITE_MARKUPAI_URL: "",
        VITE_MARKUPAI_ENV: env,
      });

      expect(getApiBaseUrl()).toBe(expected);
    });

    it.each([
      { env: "", scenario: "not set" },
      { env: "invalid-env", scenario: "invalid" },
      { env: "unknown", scenario: "not in mapping" },
    ])("should default to prod URL when VITE_MARKUPAI_ENV is $scenario", async ({ env }) => {
      await setupEnvAndImport({
        VITE_MARKUPAI_URL: "",
        VITE_MARKUPAI_ENV: env,
      });

      expect(getApiBaseUrl()).toBe("https://api.markup.ai");
    });

    it("should handle empty string VITE_MARKUPAI_URL as not set", async () => {
      await setupEnvAndImport({
        VITE_MARKUPAI_URL: "",
        VITE_MARKUPAI_ENV: "dev",
      });

      expect(getApiBaseUrl()).toBe("https://api.dev.markup.ai");
    });
  });
});
