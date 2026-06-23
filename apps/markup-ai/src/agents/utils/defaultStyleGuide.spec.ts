import { describe, expect, it } from "vitest";
import type { StyleGuideSummaryResponse } from "../../api-client/types.gen";
import { defaultStyleGuideId } from "./defaultStyleGuide";

function styleGuide(overrides: Partial<StyleGuideSummaryResponse> = {}): StyleGuideSummaryResponse {
  return {
    id: overrides.id ?? "t-1",
    display_name: overrides.display_name ?? "Guide 1",
    is_default: overrides.is_default ?? false,
    enabled: overrides.enabled ?? true,
  };
}

describe("defaultStyleGuideId", () => {
  it("prefers the style guide named 'Main' over the API default and other enabled style guides", () => {
    expect(
      defaultStyleGuideId([
        styleGuide({ id: "first", is_default: false }),
        styleGuide({ id: "api-default", is_default: true }),
        styleGuide({ id: "main", display_name: "Main" }),
      ]),
    ).toBe("main");
  });

  it("trims surrounding whitespace when matching 'Main'", () => {
    expect(defaultStyleGuideId([styleGuide({ id: "b", display_name: "  Main  " })])).toBe("b");
  });

  it("falls back to the API-default style guide when no 'Main' exists", () => {
    expect(
      defaultStyleGuideId([
        styleGuide({ id: "first", is_default: false }),
        styleGuide({ id: "api-default", is_default: true }),
      ]),
    ).toBe("api-default");
  });

  it("falls back to the first enabled style guide when neither 'Main' nor an API default exists", () => {
    expect(
      defaultStyleGuideId([
        styleGuide({ id: "disabled", enabled: false }),
        styleGuide({ id: "first-enabled" }),
        styleGuide({ id: "second-enabled" }),
      ]),
    ).toBe("first-enabled");
  });

  it("ignores disabled style guides entirely (even when one is named Main or is the API default)", () => {
    expect(
      defaultStyleGuideId([
        styleGuide({ id: "disabled-main", display_name: "Main", enabled: false }),
        styleGuide({ id: "disabled-default", is_default: true, enabled: false }),
        styleGuide({ id: "enabled-other" }),
      ]),
    ).toBe("enabled-other");
  });

  it("returns undefined when no enabled style guide exists", () => {
    expect(defaultStyleGuideId([])).toBeUndefined();
    expect(defaultStyleGuideId([styleGuide({ enabled: false })])).toBeUndefined();
  });
});
