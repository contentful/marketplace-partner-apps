import tokens from "@contentful/f36-tokens";
import type { CortexSeverity } from "../agents/types";

// ─── Severity Colors ─────────────────────────────────────────────────────────
// Centralized color definitions for issue severity levels (high, medium, low).
// Used across SuggestionCard badges, SuggestionsSidebar pills, progress bar, etc.
// Note: low uses blue (not green) to avoid confusion with "applied/fixed" green.

export const SEVERITY_COLORS: Record<CortexSeverity, { bg: string; border: string; text: string }> =
  {
    high: { bg: "#ffebee", border: "#ef9a9a", text: "#c62828" },
    medium: { bg: "#fff3e0", border: "#ffcc80", text: "#ef6c00" },
    low: { bg: "#e3f2fd", border: "#90caf9", text: "#1565c0" },
  };

/** Progress bar segment colors by severity (using Contentful design tokens) */
export const SEVERITY_BAR_COLORS: Record<CortexSeverity, string> = {
  high: tokens.red600,
  medium: tokens.yellow500,
  low: tokens.blue400,
};

/** Progress bar color for applied/fixed issues */
export const APPLIED_BAR_COLOR = tokens.green400;

/** Progress bar color for dismissed issues */
export const DISMISSED_BAR_COLOR = tokens.gray300;

export const SCORE_COLORS = {
  neutral: "#E7EBEE",
  low: "#DA294A",
  medium: "#FFD960",
  high: "#5DB057",
};

export const SCORE_COLORS_SOFT = {
  neutral: "#E7EBEE",
  low: "#FFB1B2",
  medium: "#FFE993",
  high: "#9ED696",
};

export const SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  FAIR: 60,
  POOR: 0,
} as const;

const BASE_SCORE_COLORS = {
  darkGreen: "#2e7d32",
  mediumGreen: "#82ca9d",
  lightGreen: "#e8f5e9",
  greenBorder: "#c8e6c9",
  tealGreen: "#00a699",
  orange: "#f57c00",
  darkOrange: "#ef6c00",
  lightOrange: "#ffa726",
  lightYellow: "#fff9e6",
  yellowBorder: "#ffe082",
  peach: "#fff3e0",
  orangeBorder: "#ffcc80",
  darkRed: "#c62828",
  red: "#ef4444",
  lightRed: "#ffebee",
  redBorder: "#ffcdd2",
} as const;

export const SCORE_BACKGROUND_COLORS = {
  excellent: BASE_SCORE_COLORS.lightGreen,
  good: BASE_SCORE_COLORS.lightYellow,
  fair: BASE_SCORE_COLORS.peach,
  poor: BASE_SCORE_COLORS.lightRed,
} as const;

export const SCORE_TEXT_COLORS = {
  excellent: BASE_SCORE_COLORS.darkGreen,
  good: BASE_SCORE_COLORS.orange,
  fair: BASE_SCORE_COLORS.darkOrange,
  poor: BASE_SCORE_COLORS.darkRed,
} as const;

export const SCORE_BORDER_COLORS = {
  excellent: BASE_SCORE_COLORS.greenBorder,
  good: BASE_SCORE_COLORS.yellowBorder,
  fair: BASE_SCORE_COLORS.orangeBorder,
  poor: BASE_SCORE_COLORS.redBorder,
} as const;

export const SCORE_NUMBER_COLORS = {
  excellent: BASE_SCORE_COLORS.darkGreen,
  good: BASE_SCORE_COLORS.mediumGreen,
  fair: BASE_SCORE_COLORS.lightOrange,
  poor: BASE_SCORE_COLORS.red,
} as const;

export function getScoreColorString(score: number): string {
  const roundedScore = Math.round(score);
  if (roundedScore >= 0 && roundedScore <= 59) return SCORE_COLORS.low;
  if (roundedScore >= 60 && roundedScore <= 79) return SCORE_COLORS.medium;
  if (roundedScore >= 80 && roundedScore <= 100) return SCORE_COLORS.high;
  return SCORE_COLORS.neutral;
}

export function getScoreColorStringSoft(score: number): string {
  const roundedScore = Math.round(score);
  if (roundedScore >= 0 && roundedScore <= 59) return SCORE_COLORS_SOFT.low;
  if (roundedScore >= 60 && roundedScore <= 79) return SCORE_COLORS_SOFT.medium;
  if (roundedScore >= 80 && roundedScore <= 100) return SCORE_COLORS_SOFT.high;
  return SCORE_COLORS_SOFT.neutral;
}

export function getScoreBackgroundColor(score: number | null): string {
  if (score === null) return tokens.gray100;
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_BACKGROUND_COLORS.excellent;
  if (score >= SCORE_THRESHOLDS.GOOD) return SCORE_BACKGROUND_COLORS.good;
  if (score >= SCORE_THRESHOLDS.FAIR) return SCORE_BACKGROUND_COLORS.fair;
  return SCORE_BACKGROUND_COLORS.poor;
}

export function getScoreTextColor(score: number | null): string {
  if (score === null) return tokens.gray500;
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_TEXT_COLORS.excellent;
  if (score >= SCORE_THRESHOLDS.GOOD) return SCORE_TEXT_COLORS.good;
  if (score >= SCORE_THRESHOLDS.FAIR) return SCORE_TEXT_COLORS.fair;
  return SCORE_TEXT_COLORS.poor;
}

export function getScoreBorderColor(score: number | null): string {
  if (score === null) return tokens.gray300;
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_BORDER_COLORS.excellent;
  if (score >= SCORE_THRESHOLDS.GOOD) return SCORE_BORDER_COLORS.good;
  if (score >= SCORE_THRESHOLDS.FAIR) return SCORE_BORDER_COLORS.fair;
  return SCORE_BORDER_COLORS.poor;
}

export function getScoreNumberColor(score: number | null): string {
  if (score === null) return tokens.gray400;
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_NUMBER_COLORS.excellent;
  if (score >= SCORE_THRESHOLDS.GOOD) return SCORE_NUMBER_COLORS.good;
  if (score >= SCORE_THRESHOLDS.FAIR) return SCORE_NUMBER_COLORS.fair;
  return SCORE_NUMBER_COLORS.poor;
}

export function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return BASE_SCORE_COLORS.tealGreen;
  if (score >= SCORE_THRESHOLDS.GOOD) return BASE_SCORE_COLORS.mediumGreen;
  if (score >= SCORE_THRESHOLDS.FAIR) return BASE_SCORE_COLORS.lightOrange;
  return BASE_SCORE_COLORS.red;
}

export function formatScoreForDisplay(score: number): string {
  if (score === 0) return "—";
  return Math.round(score).toString();
}
