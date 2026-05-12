import type { CortexIssue, CortexIssueIngest, CortexIssueWithId, CortexSeverity } from "../types";

/** Returns `low`, `medium`, or `high`. Unknown values become `low`. */
export function normalizeCortexSeverity(raw: unknown): CortexSeverity {
  if (raw === "high" || raw === "medium" || raw === "low") return raw;
  return "low";
}

/**
 * Simple 32-bit polynomial string hash. Collisions are theoretically possible
 * but unlikely given keys include agent + explanation + sentence + offsets.
 */
export function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    const codePoint = input.codePointAt(i) ?? 0;
    // `|= 0` coerces to a 32-bit signed integer and keeps the hash from growing
    // unbounded; Math.trunc does not provide the same wrap-around behavior.
    hash = (hash << 5) - hash + codePoint;
    hash |= 0;
  }
  return (hash >>> 0).toString(36);
}

export function generateGroupKey(
  issue: Pick<CortexIssue, "agent" | "explanation" | "position">,
): string {
  const key = `${issue.agent}|${issue.explanation}|${issue.position.sentence}`;
  return `group-${hashString(key)}`;
}

export function generateIssueId(
  issue: Pick<CortexIssue, "agent" | "explanation" | "position">,
): string {
  const key = `${issue.agent}|${issue.explanation}|${issue.position.sentence}|${String(issue.position.start)}|${String(issue.position.end)}`;
  return `issue-${hashString(key)}`;
}

/** Deduplicate, assign IDs, and compute original text from the document content. */
export function toIssuesWithIds(
  issues: ReadonlyArray<CortexIssueIngest>,
  contentText: string,
): CortexIssueWithId[] {
  const seen = new Set<string>();
  const result: CortexIssueWithId[] = [];
  const len = contentText.length;

  for (const issue of issues) {
    const id = generateIssueId(issue);
    if (seen.has(id)) continue;
    seen.add(id);

    // Stream/API issues use half-open UTF-16 code unit offsets: [start, end).
    const start = Math.max(0, Math.min(issue.position.start, len));
    const end = Math.max(start, Math.min(issue.position.end, len));

    const sev = normalizeCortexSeverity(issue.severity);
    result.push({
      ...issue,
      severity: sev,
      id,
      groupKey: generateGroupKey(issue),
      status: "active",
      original: start < end ? contentText.slice(start, end) : "",
    });
  }

  return result;
}
