import type { CortexIssueWithId } from "../types";

/**
 * Suggestion strings to show in an issue card.
 * Prefer `suggestions` from the agent payload when non-empty; otherwise `suggestion`.
 */
export function getAgenticSuggestionChoices(
  issue: Pick<CortexIssueWithId, "suggestion" | "suggestions">,
): string[] {
  const fromArray = (issue.suggestions ?? []).filter(
    (s): s is string => typeof s === "string" && s.length > 0,
  );
  if (fromArray.length > 0) return fromArray;
  if (issue.suggestion != null && issue.suggestion !== "") return [issue.suggestion];
  return [];
}
