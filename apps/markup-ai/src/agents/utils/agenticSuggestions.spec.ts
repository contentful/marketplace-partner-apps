import { describe, expect, it } from "vitest";
import { getAgenticSuggestionChoices } from "./agenticSuggestions";

describe("getAgenticSuggestionChoices", () => {
  it("returns empty when neither suggestion nor suggestions is set", () => {
    expect(getAgenticSuggestionChoices({})).toEqual([]);
  });

  it("returns empty when suggestion is empty string and suggestions is undefined", () => {
    expect(getAgenticSuggestionChoices({ suggestion: "" })).toEqual([]);
  });

  it("returns single suggestion when only legacy field is set", () => {
    expect(getAgenticSuggestionChoices({ suggestion: "fixed" })).toEqual(["fixed"]);
  });

  it("prefers suggestions array when non-empty over single suggestion", () => {
    const result = getAgenticSuggestionChoices({
      suggestion: "legacy",
      suggestions: ["alpha", "beta"],
    });
    expect(result).toEqual(["alpha", "beta"]);
  });

  it("filters out empty strings and non-strings from suggestions", () => {
    const result = getAgenticSuggestionChoices({
      suggestions: ["alpha", "", "beta", null as unknown as string, undefined as unknown as string],
      suggestion: "fallback",
    });
    expect(result).toEqual(["alpha", "beta"]);
  });

  it("falls back to single suggestion when suggestions array is all empty", () => {
    const result = getAgenticSuggestionChoices({
      suggestions: ["", ""],
      suggestion: "fallback",
    });
    expect(result).toEqual(["fallback"]);
  });

  it("returns empty when suggestions array is all-empty and no fallback", () => {
    expect(getAgenticSuggestionChoices({ suggestions: ["", ""] })).toEqual([]);
  });
});
