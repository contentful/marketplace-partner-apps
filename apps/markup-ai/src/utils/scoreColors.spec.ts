import { describe, it, expect } from "vitest";
import {
  getScoreColorString,
  getScoreColorStringSoft,
  formatScoreForDisplay,
  SCORE_COLORS,
  SCORE_COLORS_SOFT,
} from "./scoreColors";

describe("scoreColors", () => {
  it("getScoreColorString returns low/medium/high and neutral fallback", () => {
    expect(getScoreColorString(10)).toBe(SCORE_COLORS.low);
    expect(getScoreColorString(60)).toBe(SCORE_COLORS.medium);
    expect(getScoreColorString(80)).toBe(SCORE_COLORS.high);
    expect(getScoreColorString(200)).toBe(SCORE_COLORS.neutral);
  });

  it("getScoreColorStringSoft respects ranges", () => {
    expect(getScoreColorStringSoft(10)).toBe(SCORE_COLORS_SOFT.low);
    expect(getScoreColorStringSoft(60)).toBe(SCORE_COLORS_SOFT.medium);
    expect(getScoreColorStringSoft(80)).toBe(SCORE_COLORS_SOFT.high);
    expect(getScoreColorStringSoft(200)).toBe(SCORE_COLORS_SOFT.neutral);
  });

  it("formatScoreForDisplay returns dash for 0 else rounded", () => {
    expect(formatScoreForDisplay(0)).toBe("—");
    expect(formatScoreForDisplay(79.6)).toBe("80");
  });
});
