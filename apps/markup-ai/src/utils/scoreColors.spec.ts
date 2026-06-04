import { describe, it, expect } from "vitest";
import tokens from "@contentful/f36-tokens";
import {
  getScoreColorString,
  getScoreColorStringSoft,
  formatScoreForDisplay,
  getScoreBackgroundColor,
  getScoreTextColor,
  getScoreBorderColor,
  getScoreNumberColor,
  getScoreColor,
  SCORE_COLORS,
  SCORE_COLORS_SOFT,
  SCORE_BACKGROUND_COLORS,
  SCORE_TEXT_COLORS,
  SCORE_BORDER_COLORS,
  SCORE_NUMBER_COLORS,
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

  describe("getScoreBackgroundColor", () => {
    it("returns gray100 for null", () => {
      expect(getScoreBackgroundColor(null)).toBe(tokens.gray100);
    });
    it("maps thresholds to excellent/good/fair/poor", () => {
      expect(getScoreBackgroundColor(95)).toBe(SCORE_BACKGROUND_COLORS.excellent);
      expect(getScoreBackgroundColor(80)).toBe(SCORE_BACKGROUND_COLORS.good);
      expect(getScoreBackgroundColor(65)).toBe(SCORE_BACKGROUND_COLORS.fair);
      expect(getScoreBackgroundColor(10)).toBe(SCORE_BACKGROUND_COLORS.poor);
    });
  });

  describe("getScoreTextColor", () => {
    it("returns gray500 for null", () => {
      expect(getScoreTextColor(null)).toBe(tokens.gray500);
    });
    it("maps thresholds to excellent/good/fair/poor", () => {
      expect(getScoreTextColor(95)).toBe(SCORE_TEXT_COLORS.excellent);
      expect(getScoreTextColor(80)).toBe(SCORE_TEXT_COLORS.good);
      expect(getScoreTextColor(65)).toBe(SCORE_TEXT_COLORS.fair);
      expect(getScoreTextColor(10)).toBe(SCORE_TEXT_COLORS.poor);
    });
  });

  describe("getScoreBorderColor", () => {
    it("returns gray300 for null", () => {
      expect(getScoreBorderColor(null)).toBe(tokens.gray300);
    });
    it("maps thresholds to excellent/good/fair/poor", () => {
      expect(getScoreBorderColor(95)).toBe(SCORE_BORDER_COLORS.excellent);
      expect(getScoreBorderColor(80)).toBe(SCORE_BORDER_COLORS.good);
      expect(getScoreBorderColor(65)).toBe(SCORE_BORDER_COLORS.fair);
      expect(getScoreBorderColor(10)).toBe(SCORE_BORDER_COLORS.poor);
    });
  });

  describe("getScoreNumberColor", () => {
    it("returns gray400 for null", () => {
      expect(getScoreNumberColor(null)).toBe(tokens.gray400);
    });
    it("maps thresholds to excellent/good/fair/poor", () => {
      expect(getScoreNumberColor(95)).toBe(SCORE_NUMBER_COLORS.excellent);
      expect(getScoreNumberColor(80)).toBe(SCORE_NUMBER_COLORS.good);
      expect(getScoreNumberColor(65)).toBe(SCORE_NUMBER_COLORS.fair);
      expect(getScoreNumberColor(10)).toBe(SCORE_NUMBER_COLORS.poor);
    });
  });

  describe("getScoreColor", () => {
    it("maps each threshold band to a distinct color", () => {
      const excellent = getScoreColor(95);
      const good = getScoreColor(80);
      const fair = getScoreColor(65);
      const poor = getScoreColor(10);
      expect(new Set([excellent, good, fair, poor]).size).toBe(4);
    });
  });
});
