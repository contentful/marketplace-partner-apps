import { describe, it, expect } from "vitest";
import { buildPath, normalizePath } from "./path";

describe("path edge cases", () => {
  it("strips trailing slashes from slugs", () => {
    expect(buildPath("", "foo/")).toBe("/foo");
    expect(buildPath("/news", "a/")).toBe("/news/a");
  });

  it("supports a homepage entry with slug '/'", () => {
    expect(normalizePath("/")).toBe("/");
    expect(buildPath("/news", "/")).toBe("/"); // absolute override
  });

  it("preserves case (paths are case-sensitive)", () => {
    expect(normalizePath("/About")).toBe("/About");
    expect(normalizePath("/About")).not.toBe(normalizePath("/about"));
  });

  it("returns empty string for whitespace-only slugs", () => {
    expect(buildPath("/news", "   ")).toBe("");
    expect(buildPath(undefined, "")).toBe("");
  });

  it("collapses accidental double slashes from prefix joins", () => {
    expect(buildPath("/news/", "a")).toBe("/news/a");
    expect(buildPath("//news", "a")).toBe("/news/a");
  });
});
