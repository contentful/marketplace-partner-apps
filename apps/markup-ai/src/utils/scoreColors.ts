export const SCORE_COLORS = {
  neutral: '#E7EBEE',
  low: '#FFA2A2',
  medium: '#F6F068',
  high: '#78FD86',
};

export const SCORE_COLORS_SOFT = {
  neutral: '#E7EBEE',
  low: '#fcd9e4',
  medium: '#fff7c5',
  high: '#caffc9',
};

// Utility to get color and neutral state for a given score
export function getScoreColor(score: number): { background: string; isNeutral: boolean } {
  const roundedScore = Math.round(score);
  if (roundedScore === 0) {
    return { background: SCORE_COLORS.neutral, isNeutral: true };
  } else if (roundedScore > 0 && roundedScore < 60) {
    return { background: SCORE_COLORS.low, isNeutral: false };
  } else if (roundedScore >= 60 && roundedScore < 80) {
    return { background: SCORE_COLORS.medium, isNeutral: false };
  } else {
    return { background: SCORE_COLORS.high, isNeutral: false };
  }
}

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

// Utility function to format score as integer for display
export function formatScoreForDisplay(score: number): string {
  if (score === 0) return '—';
  return Math.round(score).toString();
}
