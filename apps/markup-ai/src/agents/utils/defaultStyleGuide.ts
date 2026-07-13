import type { StyleGuideSummaryResponse } from "../../api-client/types.gen";

/**
 * Pick the preferred default style guide id from a list of style guides:
 * the one named "Main" if present, otherwise any style guide marked default
 * by the API, otherwise the first enabled style guide. Returns `undefined`
 * only when no enabled candidate exists. The final "first enabled"
 * fallback guarantees that any org with at least one usable style guide gets
 * a style_guide_id chosen for it — the backend does not always pick a default
 * when the field is omitted, so we must always send one.
 *
 * Mirrors the sidebar-app implementation (INT-520).
 */
export function defaultStyleGuideId(styleGuides: StyleGuideSummaryResponse[]): string | undefined {
  const enabled = styleGuides.filter((g) => g.enabled);
  const main = enabled.find((g) => g.display_name.trim() === "Main");
  if (main) return main.id;
  const apiDefault = enabled.find((g) => g.is_default);
  if (apiDefault) return apiDefault.id;
  return enabled[0]?.id;
}
