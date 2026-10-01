import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAppConfig } from "./useAppConfig";
import { DEFAULT_CONFIG } from "../config/defaults";

describe("useAppConfig", () => {
  it("loads config from sdk.parameters.installation and normalizes baseUrl", async () => {
    const sdk = {
      parameters: {
        installation: {
          baseUrl: "example.com",
          locale: "en-US",
          sources: [
            {
              contentTypeId: "page",
              pathFieldId: "slug",
              titleFieldId: "title",
            },
          ],
        },
      },
    };

    const { result } = renderHook(() => useAppConfig(sdk));

    // Wait for the hook to finish loading (avoid flaky initial-state assertions)
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.config.baseUrl).toBe("https://example.com");
    expect(result.current.config.locale).toBe("en-US");
    expect(result.current.config.sources[0].contentTypeId).toBe("page");
  });

  it("falls back to sdk.app.getParameters when installation params are not available", async () => {
    const sdk = {
      app: {
        getParameters: async () => ({
          baseUrl: "https://already-normal.com",
          locale: "fr-FR",
          sources: [{ contentTypeId: "article", pathFieldId: "slug" }],
        }),
      },
    };

    const { result } = renderHook(() => useAppConfig(sdk));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.config.baseUrl).toBe("https://already-normal.com");
    expect(result.current.config.locale).toBe("fr-FR");
    expect(result.current.config.sources[0].contentTypeId).toBe("article");
  });

  it("sets an error when neither installation params nor app.getParameters are available", async () => {
    const sdk = {}; // neither parameters.installation nor app.getParameters

    const { result } = renderHook(() => useAppConfig(sdk));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config).toEqual(DEFAULT_CONFIG);
    expect(result.current.error).toMatch(/Unable to read installation parameters/i);
  });

  describe("detectOrphans normalization", () => {
    it("defaults to true when detectOrphans is absent", async () => {
      const sdk = {
        parameters: {
          installation: { baseUrl: "https://example.com", locale: "en-US", sources: [] },
        },
      };
      const { result } = renderHook(() => useAppConfig(sdk));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.config.detectOrphans).toBe(true);
    });

    it("is true when detectOrphans is explicitly true", async () => {
      const sdk = {
        parameters: {
          installation: {
            baseUrl: "https://example.com",
            locale: "en-US",
            sources: [],
            detectOrphans: true,
          },
        },
      };
      const { result } = renderHook(() => useAppConfig(sdk));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.config.detectOrphans).toBe(true);
    });

    it("is false when detectOrphans is explicitly false", async () => {
      const sdk = {
        parameters: {
          installation: {
            baseUrl: "https://example.com",
            locale: "en-US",
            sources: [],
            detectOrphans: false,
          },
        },
      };
      const { result } = renderHook(() => useAppConfig(sdk));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.config.detectOrphans).toBe(false);
    });
  });
});
