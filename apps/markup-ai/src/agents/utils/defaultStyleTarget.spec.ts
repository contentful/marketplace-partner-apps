import { describe, expect, it } from "vitest";
import type { TargetResponse } from "../../api-client/types.gen";
import { defaultStyleTargetId } from "./defaultStyleTarget";

function target(overrides: Partial<TargetResponse> = {}): TargetResponse {
  return {
    id: overrides.id ?? "t-1",
    display_name: overrides.display_name ?? "Guide 1",
    is_default: overrides.is_default ?? false,
    enabled: overrides.enabled ?? true,
  };
}

describe("defaultStyleTargetId", () => {
  it("prefers the target named 'Main' over the API default and other enabled targets", () => {
    expect(
      defaultStyleTargetId([
        target({ id: "first", is_default: false }),
        target({ id: "api-default", is_default: true }),
        target({ id: "main", display_name: "Main" }),
      ]),
    ).toBe("main");
  });

  it("trims surrounding whitespace when matching 'Main'", () => {
    expect(defaultStyleTargetId([target({ id: "b", display_name: "  Main  " })])).toBe("b");
  });

  it("falls back to the API-default target when no 'Main' exists", () => {
    expect(
      defaultStyleTargetId([
        target({ id: "first", is_default: false }),
        target({ id: "api-default", is_default: true }),
      ]),
    ).toBe("api-default");
  });

  it("falls back to the first enabled target when neither 'Main' nor an API default exists", () => {
    expect(
      defaultStyleTargetId([
        target({ id: "disabled", enabled: false }),
        target({ id: "first-enabled" }),
        target({ id: "second-enabled" }),
      ]),
    ).toBe("first-enabled");
  });

  it("ignores disabled targets entirely (even when one is named Main or is the API default)", () => {
    expect(
      defaultStyleTargetId([
        target({ id: "disabled-main", display_name: "Main", enabled: false }),
        target({ id: "disabled-default", is_default: true, enabled: false }),
        target({ id: "enabled-other" }),
      ]),
    ).toBe("enabled-other");
  });

  it("returns undefined when no enabled target exists", () => {
    expect(defaultStyleTargetId([])).toBeUndefined();
    expect(defaultStyleTargetId([target({ enabled: false })])).toBeUndefined();
  });
});
