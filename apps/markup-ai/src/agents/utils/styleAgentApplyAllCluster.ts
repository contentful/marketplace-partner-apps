import type { CortexIssueWithId } from "../types";
import { getAgenticSuggestionChoices } from "./agenticSuggestions";
import { hashString } from "./issueIds";

function styleAgentSuggestionSetFingerprint(
  issue: Pick<CortexIssueWithId, "suggestion" | "suggestions">,
): string {
  const choices = getAgenticSuggestionChoices(issue);
  const normalized = choices
    .map((c) => c.trim().toLowerCase())
    .filter((c) => c.length > 0)
    .sort((x, y) => x.localeCompare(y));
  return hashString(normalized.join(""));
}

/**
 * Stable key for grouping style_agent issues that are the "same" logical hit
 * (same category + same flagged text + same suggestion choice set).
 */
export function getStyleAgentApplyAllClusterKey(
  issue: Pick<CortexIssueWithId, "category" | "original" | "suggestion" | "suggestions">,
): string {
  const category = (issue.category ?? "").trim();
  const suggestionFp = styleAgentSuggestionSetFingerprint(issue);
  const key = `${category}|${issue.original}|${suggestionFp}`;
  return `style-dup-${hashString(key)}`;
}

/** True when `appliedText` matches one of the issue's selectable suggestion strings (trim + case-insensitive). */
export function styleAgentIssueAcceptsSuggestion(
  issue: Pick<CortexIssueWithId, "suggestion" | "suggestions">,
  appliedText: string,
): boolean {
  const choices = getAgenticSuggestionChoices(issue);
  if (choices.includes(appliedText)) return true;
  const norm = (s: string) => s.trim().toLowerCase();
  const t = norm(appliedText);
  return choices.some((c) => norm(c) === t);
}

/** Per-issue count of active style_agent rows sharing the same apply-all cluster key (includes self). */
export function buildStyleAgentApplyAllPeerCountByIssueId(
  allIssues: readonly CortexIssueWithId[],
): Map<string, number> {
  const keyCount = new Map<string, number>();
  for (const i of allIssues) {
    if (i.agent !== "style_agent" || i.status !== "active") continue;
    const k = getStyleAgentApplyAllClusterKey(i);
    keyCount.set(k, (keyCount.get(k) ?? 0) + 1);
  }
  const byIssueId = new Map<string, number>();
  for (const i of allIssues) {
    if (i.agent !== "style_agent" || i.status !== "active") continue;
    const k = getStyleAgentApplyAllClusterKey(i);
    byIssueId.set(i.id, keyCount.get(k) ?? 1);
  }
  return byIssueId;
}
