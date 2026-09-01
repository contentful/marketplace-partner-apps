import { describe, it, expect } from "vitest";
import { getConfig } from "../../src/config/getConfig";
import { DEFAULT_CONFIG } from "../../src/config/defaults";
import type { AppConfig } from "../../src/core/types";

function createMockSdk(params: unknown) {
  return {
    app: {
      getParameters: async () => params,
    },
  };
}

describe("getConfig", () => {
  it("returns DEFAULT_CONFIG when no parameters are provided", async () => {
    const sdk = createMockSdk(null);

    const result = await getConfig(sdk);

    expect(result).toEqual({
      ...DEFAULT_CONFIG,
      baseUrl: DEFAULT_CONFIG.baseUrl,
    });
  });

  it("overrides defaults with provided parameters", async () => {
    const params: Partial<AppConfig> = {
      baseUrl: "https://example.com",
      locale: "fr-FR",
      sources: [
        {
          contentTypeId: "article",
          pathFieldId: "slug",
        },
      ],
    };

    const sdk = createMockSdk(params);

    const result = await getConfig(sdk);

    expect(result.locale).toBe("fr-FR");
    expect(result.sources).toEqual(params.sources);

    // baseUrl should be normalized
    expect(result.baseUrl).toBe("https://example.com");
  });

  it("falls back to empty sources array when sources is not an array", async () => {
    const params = {
      baseUrl: "https://example.com",
      sources: "not-an-array",
    };

    const sdk = createMockSdk(params);

    const result = await getConfig(sdk);

    expect(Array.isArray(result.sources)).toBe(true);
    expect(result.sources).toEqual([]);
  });

  it("normalizes baseUrl using DEFAULT_CONFIG when missing", async () => {
    const params: Partial<AppConfig> = {
      locale: "en-GB",
    };

    const sdk = createMockSdk(params);

    const result = await getConfig(sdk);

    expect(result.baseUrl).toBe(DEFAULT_CONFIG.baseUrl);
    expect(result.locale).toBe("en-GB");
  });
});
