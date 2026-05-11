import { describe, expect, it } from "vitest";
import { runCatalogAgentsFullyReported } from "./agenticScanProgress";

describe("runCatalogAgentsFullyReported", () => {
  it("is false when no agents were requested", () => {
    expect(runCatalogAgentsFullyReported([], new Set())).toBe(false);
    expect(runCatalogAgentsFullyReported([], new Set(["style_agent"]))).toBe(false);
  });

  it("is true when every requested agent has reported", () => {
    expect(runCatalogAgentsFullyReported(["style_agent"], new Set(["style_agent"]))).toBe(true);
    expect(
      runCatalogAgentsFullyReported(
        ["style_agent", "focus_agent"],
        new Set(["style_agent", "focus_agent", "extra"]),
      ),
    ).toBe(true);
  });

  it("is false when at least one requested agent has not reported", () => {
    expect(
      runCatalogAgentsFullyReported(["style_agent", "focus_agent"], new Set(["style_agent"])),
    ).toBe(false);
  });
});
