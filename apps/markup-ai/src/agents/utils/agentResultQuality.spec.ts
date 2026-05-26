import { describe, expect, it } from "vitest";
import { parseAgentResultQuality } from "./agentResultQuality";

describe("parseAgentResultQuality", () => {
  it("extracts score and status from a well-formed quality block", () => {
    expect(parseAgentResultQuality({ quality: { score: 87.5, status: "good" } })).toEqual({
      score: 87.5,
      status: "good",
    });
  });

  it("returns just the score when status is missing", () => {
    expect(parseAgentResultQuality({ quality: { score: 42 } })).toEqual({ score: 42 });
  });

  it("returns null when result is null or primitive", () => {
    expect(parseAgentResultQuality(null)).toBeNull();
    expect(parseAgentResultQuality(undefined)).toBeNull();
    expect(parseAgentResultQuality("nope")).toBeNull();
    expect(parseAgentResultQuality(123)).toBeNull();
  });

  it("returns null when quality block is missing or not an object", () => {
    expect(parseAgentResultQuality({})).toBeNull();
    expect(parseAgentResultQuality({ quality: null })).toBeNull();
    expect(parseAgentResultQuality({ quality: "bad" })).toBeNull();
  });

  it("returns null when score is missing or not a finite number", () => {
    expect(parseAgentResultQuality({ quality: {} })).toBeNull();
    expect(parseAgentResultQuality({ quality: { score: "87" } })).toBeNull();
    expect(parseAgentResultQuality({ quality: { score: Number.NaN } })).toBeNull();
  });

  it("ignores a non-string status field instead of dropping the score", () => {
    expect(parseAgentResultQuality({ quality: { score: 10, status: 42 } })).toEqual({ score: 10 });
  });
});
