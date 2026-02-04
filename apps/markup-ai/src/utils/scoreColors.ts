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
  if (score === 0) return "—";
  return Math.round(score).toString();
}
