import { describe, it, expect } from 'vitest';
import {
  getScoreColor,
  getScoreColorString,
  getScoreColorStringSoft,
  formatScoreForDisplay,
  SCORE_COLORS,
  SCORE_COLORS_SOFT,
} from './scoreColors';

describe('scoreColors', () => {
  it('getScoreColor returns neutral for 0', () => {
    expect(getScoreColor(0)).toEqual({ background: SCORE_COLORS.neutral, isNeutral: true });
  });
  it('getScoreColor returns low for <60', () => {
    expect(getScoreColor(10).background).toBe(SCORE_COLORS.low);
  });
  it('getScoreColor returns medium for 60-79', () => {
    expect(getScoreColor(70).background).toBe(SCORE_COLORS.medium);
  });
  it('getScoreColor returns high for >=80', () => {
    expect(getScoreColor(90).background).toBe(SCORE_COLORS.high);
  });

  it('getScoreColorString respects ranges', () => {
    expect(getScoreColorString(10)).toBe(SCORE_COLORS.low);
    expect(getScoreColorString(60)).toBe(SCORE_COLORS.medium);
    expect(getScoreColorString(80)).toBe(SCORE_COLORS.high);
    expect(getScoreColorString(200)).toBe(SCORE_COLORS.neutral);
  });

  it('getScoreColorStringSoft respects ranges', () => {
    expect(getScoreColorStringSoft(10)).toBe(SCORE_COLORS_SOFT.low);
    expect(getScoreColorStringSoft(60)).toBe(SCORE_COLORS_SOFT.medium);
    expect(getScoreColorStringSoft(80)).toBe(SCORE_COLORS_SOFT.high);
    expect(getScoreColorStringSoft(200)).toBe(SCORE_COLORS_SOFT.neutral);
  });

  it('formatScoreForDisplay returns dash for 0 else rounded', () => {
    expect(formatScoreForDisplay(0)).toBe('—');
    expect(formatScoreForDisplay(79.6)).toBe('80');
  });
});
