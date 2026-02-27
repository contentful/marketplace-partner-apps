import tokens from "@contentful/f36-tokens";
import { Severity } from "../api-client/types.gen";

// ─── Severity Colors ─────────────────────────────────────────────────────────
// Centralized color definitions for issue severity levels (High, Medium, Low).
// Used across SuggestionCard badges, SuggestionsSidebar pills, progress bar, etc.
// Note: Low uses blue (not green) to avoid confusion with "applied/fixed" green.

export const SEVERITY_COLORS: Record<Severity, { bg: string; border: string; text: string }> = {
  [Severity.HIGH]: { bg: "#ffebee", border: "#ef9a9a", text: "#c62828" },
  [Severity.MEDIUM]: { bg: "#fff3e0", border: "#ffcc80", text: "#ef6c00" },
  [Severity.LOW]: { bg: "#e3f2fd", border: "#90caf9", text: "#1565c0" },
};

/** Progress bar segment colors by severity (using Contentful design tokens) */
export const SEVERITY_BAR_COLORS: Record<Severity, string> = {
  [Severity.HIGH]: tokens.red600,
  [Severity.MEDIUM]: tokens.yellow500,
  [Severity.LOW]: tokens.blue400,
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

/**
 * Score thresholds used across the application
 */
export const SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  FAIR: 60,
  POOR: 0,
} as const;

/**
 * Base color palette for score-related UI elements.
 * These are the foundational colors that other score color sets reference.
 */
const BASE_SCORE_COLORS = {
  // Greens
  darkGreen: "#2e7d32",
  mediumGreen: "#82ca9d",
  lightGreen: "#e8f5e9",
  greenBorder: "#c8e6c9",
  tealGreen: "#00a699",

  // Oranges/Yellows
  orange: "#f57c00",
  darkOrange: "#ef6c00",
  lightOrange: "#ffa726",
  lightYellow: "#fff9e6",
  yellowBorder: "#ffe082",
  peach: "#fff3e0",
  orangeBorder: "#ffcc80",

  // Reds
  darkRed: "#c62828",
  red: "#ef4444",
  lightRed: "#ffebee",
  redBorder: "#ffcdd2",
} as const;

/**
 * Background colors for score badges/containers (pastel tones)
 */
export const SCORE_BACKGROUND_COLORS = {
  excellent: BASE_SCORE_COLORS.lightGreen,
  good: BASE_SCORE_COLORS.lightYellow,
  fair: BASE_SCORE_COLORS.peach,
  poor: BASE_SCORE_COLORS.lightRed,
} as const;

/**
 * Text colors for score labels and badges.
 * Uses warmer colors to indicate severity - even "good" scores show orange
 * to encourage improvement toward "excellent".
 */
export const SCORE_TEXT_COLORS = {
  excellent: BASE_SCORE_COLORS.darkGreen,
  good: BASE_SCORE_COLORS.orange,
  fair: BASE_SCORE_COLORS.darkOrange,
  poor: BASE_SCORE_COLORS.darkRed,
} as const;

/**
 * Border colors for score containers
 */
export const SCORE_BORDER_COLORS = {
  excellent: BASE_SCORE_COLORS.greenBorder,
  good: BASE_SCORE_COLORS.yellowBorder,
  fair: BASE_SCORE_COLORS.orangeBorder,
  poor: BASE_SCORE_COLORS.redBorder,
} as const;

/**
 * Colors for score number display (the actual numeric value).
 * Uses a green-to-red gradient to provide intuitive visual feedback:
 * - excellent/good: green tones (positive)
 * - fair/poor: orange/red tones (needs attention)
 *
 * Note: These intentionally differ from SCORE_TEXT_COLORS because
 * score numbers use a simpler green-to-red scale, while text labels
 * use warmer warning colors even for "good" scores.
 */
export const SCORE_NUMBER_COLORS = {
  excellent: BASE_SCORE_COLORS.darkGreen,
  good: BASE_SCORE_COLORS.mediumGreen,
  fair: BASE_SCORE_COLORS.lightOrange,
  poor: BASE_SCORE_COLORS.red,
} as const;

// Simple function that returns just the color string based on score ranges
export function getScoreColorString(score: number): string {
  const roundedScore = Math.round(score);
  if (roundedScore >= 0 && roundedScore <= 59) return SCORE_COLORS.low;
  if (roundedScore >= 60 && roundedScore <= 79) return SCORE_COLORS.medium;
  if (roundedScore >= 80 && roundedScore <= 100) return SCORE_COLORS.high;
  return SCORE_COLORS.neutral; // fallback color
}

export function getScoreColorStringSoft(score: number): string {
  const roundedScore = Math.round(score);
  if (roundedScore >= 0 && roundedScore <= 59) return SCORE_COLORS_SOFT.low;
  if (roundedScore >= 60 && roundedScore <= 79) return SCORE_COLORS_SOFT.medium;
  if (roundedScore >= 80 && roundedScore <= 100) return SCORE_COLORS_SOFT.high;
  return SCORE_COLORS_SOFT.neutral; // fallback color
}

/**
 * Gets background color based on score (handles null for loading states)
 */
export function getScoreBackgroundColor(score: number | null): string {
  if (score === null) return tokens.gray100;
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_BACKGROUND_COLORS.excellent;
  if (score >= SCORE_THRESHOLDS.GOOD) return SCORE_BACKGROUND_COLORS.good;
  if (score >= SCORE_THRESHOLDS.FAIR) return SCORE_BACKGROUND_COLORS.fair;
  return SCORE_BACKGROUND_COLORS.poor;
}

/**
 * Gets text color based on score (handles null for loading states)
 */
export function getScoreTextColor(score: number | null): string {
  if (score === null) return tokens.gray500;
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_TEXT_COLORS.excellent;
  if (score >= SCORE_THRESHOLDS.GOOD) return SCORE_TEXT_COLORS.good;
  if (score >= SCORE_THRESHOLDS.FAIR) return SCORE_TEXT_COLORS.fair;
  return SCORE_TEXT_COLORS.poor;
}

/**
 * Gets border color based on score (handles null for loading states)
 */
export function getScoreBorderColor(score: number | null): string {
  if (score === null) return tokens.gray300;
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_BORDER_COLORS.excellent;
  if (score >= SCORE_THRESHOLDS.GOOD) return SCORE_BORDER_COLORS.good;
  if (score >= SCORE_THRESHOLDS.FAIR) return SCORE_BORDER_COLORS.fair;
  return SCORE_BORDER_COLORS.poor;
}

/**
 * Gets number indicator color based on score (handles null for loading states)
 */
export function getScoreNumberColor(score: number | null): string {
  if (score === null) return tokens.gray400;
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_NUMBER_COLORS.excellent;
  if (score >= SCORE_THRESHOLDS.GOOD) return SCORE_NUMBER_COLORS.good;
  if (score >= SCORE_THRESHOLDS.FAIR) return SCORE_NUMBER_COLORS.fair;
  return SCORE_NUMBER_COLORS.poor;
}

/**
 * Gets general score color (for charts, progress bars, etc.)
 * Uses the same green-to-red gradient as SCORE_NUMBER_COLORS
 */
export function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return BASE_SCORE_COLORS.tealGreen;
  if (score >= SCORE_THRESHOLDS.GOOD) return BASE_SCORE_COLORS.mediumGreen;
  if (score >= SCORE_THRESHOLDS.FAIR) return BASE_SCORE_COLORS.lightOrange;
  return BASE_SCORE_COLORS.red;
}

// Utility function to format score as integer for display
export function formatScoreForDisplay(score: number): string {
  if (score === 0) return "—";
  return Math.round(score).toString();
}
