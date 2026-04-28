/**
 * Constants for issue categories, colors, and other configuration
 */

/**
 * Issue category identifiers
 * Note: These should match the API's IssueCategory enum values
 */
export const ISSUE_CATEGORIES = {
  GRAMMAR: "grammar",
  CONSISTENCY: "consistency",
  TERMINOLOGY: "terminology",
  CLARITY: "clarity",
  TONE: "tone",
  SPELLING: "spelling",
  PUNCTUATION: "punctuation",
} as const;

export type IssueCategoryKey = keyof typeof ISSUE_CATEGORIES;
export type IssueCategoryValue = (typeof ISSUE_CATEGORIES)[IssueCategoryKey];

/**
 * All category IDs as an array
 */
export const CATEGORY_IDS: IssueCategoryValue[] = Object.values(ISSUE_CATEGORIES);

/**
 * Category display information
 */
export interface CategoryItem {
  id: IssueCategoryValue;
  name: string;
}

/**
 * Gets the list of category items for UI display
 */
export function getCategoryItems(): CategoryItem[] {
  return [
    { id: ISSUE_CATEGORIES.GRAMMAR, name: "Grammar" },
    { id: ISSUE_CATEGORIES.CONSISTENCY, name: "Consistency" },
    { id: ISSUE_CATEGORIES.TERMINOLOGY, name: "Terminology" },
    { id: ISSUE_CATEGORIES.SPELLING, name: "Spelling" },
    { id: ISSUE_CATEGORIES.PUNCTUATION, name: "Punctuation" },
  ];
}

/**
 * Default selected categories (exclude clarity and tone by default)
 */
export function getDefaultSelectedCategories(): Set<string> {
  return new Set([
    ISSUE_CATEGORIES.GRAMMAR,
    ISSUE_CATEGORIES.CONSISTENCY,
    ISSUE_CATEGORIES.TERMINOLOGY,
    ISSUE_CATEGORIES.SPELLING,
    ISSUE_CATEGORIES.PUNCTUATION,
  ]);
}

// Re-export score utilities from shared utils
export { SCORE_THRESHOLDS, getScoreColor } from "../../../../utils/scoreColors";

/**
 * Issue highlight styles
 */
export const ISSUE_STYLES = {
  UNDERLINE_COLOR: "#ef4444",
  UNDERLINE_THICKNESS: "2px",
  UNDERLINE_OFFSET: "4px",
  ACTIVE_BG_COLOR: "rgba(239, 68, 68, 0.15)",
} as const;

/**
 * Filter category options for the suggestions sidebar
 * These include all categories from API responses
 */
export const FILTER_CATEGORY_OPTIONS = [
  { id: "grammar", label: "Grammar" },
  { id: "consistency", label: "Consistency" },
  { id: "terminology", label: "Terminology" },
  { id: "clarity", label: "Clarity" },
  { id: "tone", label: "Tone" },
] as const;

/**
 * Category IDs as a simple array (for filter state initialization)
 */
export const FILTER_CATEGORY_IDS = FILTER_CATEGORY_OPTIONS.map((c) => c.id);

/**
 * Shared selector contract between SuggestionsSidebar and IssueHighlights
 * to detect sidebar interactions without relying on duplicated string literals.
 */
export const SUGGESTIONS_SIDEBAR_DATA_ATTRIBUTE = "data-suggestions-sidebar" as const;
export const SUGGESTIONS_SIDEBAR_DATA_VALUE = "true" as const;
export const SUGGESTIONS_SIDEBAR_SELECTOR = `[${SUGGESTIONS_SIDEBAR_DATA_ATTRIBUTE}="${SUGGESTIONS_SIDEBAR_DATA_VALUE}"]`;

/**
 * Severity options for filtering
 * Import Severity from api-client/types.gen.ts when using this
 */
export const SEVERITY_LEVELS = ["high", "medium", "low"] as const;
