import {
  JOB_FUNCTION_RULES,
  JOB_LEVEL_RULES,
  type JobFunctionRule,
  type JobLevelRule,
} from "../config/jobRoleNormalization.js";

type JobRoleContext = {
  title?: string;
  slug?: string;
  structuredHeadings?: string[] | null;
  textContent?: string;
  includeScopedTextEvidence?: boolean;
};

function normalizeRoleText(value: string): string {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildEvidenceStrings(context: JobRoleContext): string[] {
  const directEvidence = [
    context.title || "",
    context.slug || "",
    ...(context.structuredHeadings || []),
  ]
    .map(normalizeRoleText)
    .filter(Boolean);

  if (!context.includeScopedTextEvidence || !context.textContent) {
    return directEvidence;
  }

  return [
    ...directEvidence,
    ...extractScopedRoleEvidence(context.textContent),
  ].filter(Boolean);
}

function extractScopedRoleEvidence(text: string): string[] {
  const normalized = normalizeRoleText(text);
  if (!normalized) return [];

  const patterns = [
    /\b(?:chief|vice president|vp|director|head|manager|lead|consultant|architect|engineer|developer|designer|administrator|specialist|owner)\s+(?:of\s+|for\s+)?(?:[a-z0-9]+\s+){0,5}(?:marketing|content|digital|product|sales|ecommerce|retail|web|frontend|engineering|information technology|security|procurement|sourcing|seo)\b/g,
    /\b(?:marketing|content|digital|product|sales|ecommerce|retail|web|frontend|engineering|information technology|security|procurement|sourcing|seo)\s+(?:[a-z0-9]+\s+){0,4}(?:lead|manager|director|consultant|owner|specialist|developer|architect|engineer|officer)\b/g,
    /\b(?:chief marketing officer|chief technology officer|chief technical officer|chief product officer|chief information officer|chief security officer|chief executive officer|chief financial officer|chief operating officer|chief revenue officer|vice president of ecommerce|vp of ecommerce|vice president of marketing|vp of marketing|vice president of product|vp of product|director of ecommerce|director of marketing|director of content|director of engineering|head of content|head of marketing|head of ecommerce|product manager|product owner|web developer|frontend developer|front end developer|software engineer|solution architect|seo manager|content manager|content strategist|account executive)\b/g,
  ];

  const matches = new Set<string>();
  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) {
      const value = String(match[0] || "").trim();
      if (value) matches.add(value);
    }
  }
  return Array.from(matches);
}

function containsPhrase(haystack: string, phrase: string): boolean {
  const normalizedPhrase = normalizeRoleText(phrase);
  if (!normalizedPhrase) return false;
  return ` ${haystack} `.includes(` ${normalizedPhrase} `);
}

function scoreRuleMatch(
  evidence: string[],
  rule: JobFunctionRule | JobLevelRule,
): number {
  let score = 0;

  for (const line of evidence) {
    if (
      (rule.exactTitles || []).some(
        (candidate) => line === normalizeRoleText(candidate),
      )
    ) {
      score += 100;
    }
    if (
      (rule.contains || []).some((candidate) => containsPhrase(line, candidate))
    ) {
      score += 10;
    }
    if (
      (rule.excludes || []).some((candidate) => containsPhrase(line, candidate))
    ) {
      score -= 50;
    }
  }

  return score;
}

function matchRules<T extends JobFunctionRule | JobLevelRule>(
  evidence: string[],
  rules: T[],
): T[] {
  return rules
    .map((rule) => ({
      rule,
      score: scoreRuleMatch(evidence, rule),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.rule.id.localeCompare(b.rule.id))
    .map((item) => item.rule);
}

export function normalizeJobFunctionFromTitles(params: {
  current: string[];
  context: JobRoleContext;
  fallbackMode?: "preserve" | "empty";
}): string[] {
  const evidence = buildEvidenceStrings(params.context);
  const matched = matchRules(evidence, JOB_FUNCTION_RULES).map(
    (rule) => rule.taxonomyLabel,
  );
  if (matched.length === 0) {
    if (params.fallbackMode === "empty") {
      return [];
    }
    return Array.from(new Set(params.current.filter(Boolean))).slice(0, 3);
  }
  return Array.from(new Set(matched)).slice(0, 3);
}

export function normalizeJobLevelFromTitles(params: {
  current: string[];
  context: JobRoleContext;
}): string[] {
  const unique = Array.from(new Set(params.current.filter(Boolean)));
  // If the classifier already expanded to all levels (6 = level-agnostic),
  // preserve them — do not re-cap to 3.
  if (unique.length >= 6) return unique;
  const evidence = buildEvidenceStrings(params.context);
  const matched = matchRules(evidence, JOB_LEVEL_RULES).map(
    (rule) => rule.taxonomyLabel,
  );
  if (matched.length === 0) {
    return unique.slice(0, 3);
  }
  return Array.from(new Set(matched)).slice(0, 3);
}
