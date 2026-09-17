import { describe, it, expect } from "vitest";
import { DEFAULT_CONFIG } from "../../src/config/defaults";
import type { AppConfig } from "../../src/core/types";

describe("DEFAULT_CONFIG", () => {
  it("matches the expected default AppConfig shape", () => {
    const expected: AppConfig = {
      baseUrl: "",
      locale: "en-US",
      detectOrphans: true,
      sources: [
        {
          contentTypeId: "page",
          pathFieldId: "pagePath",
          titleFieldId: "title",
        },
      ],
    };

    expect(DEFAULT_CONFIG).toEqual(expected);
  });

  it("provides at least one content type source", () => {
    expect(Array.isArray(DEFAULT_CONFIG.sources)).toBe(true);
    expect(DEFAULT_CONFIG.sources.length).toBeGreaterThan(0);
  });

  it("uses a valid locale string", () => {
    expect(typeof DEFAULT_CONFIG.locale).toBe("string");
    expect(DEFAULT_CONFIG.locale.length).toBeGreaterThan(0);
  });
});
