import { sanitizeClassifierTitle as sanitizePolicyClassifierTitle } from "../config/classifierPolicy.js";

type ClassificationSnapshot = {
  assetType?: { value?: unknown };
  assetSubType?: { value?: unknown };
  schemaType?: { value?: unknown };
  product?: { value?: unknown };
  topic?: { value?: unknown };
  useCases?: { value?: unknown };
  industry?: { value?: unknown };
  companySize?: { value?: unknown };
  region?: { value?: unknown };
  language?: { value?: unknown };
  usageRights?: { value?: unknown };
  jobLevel?: { value?: unknown };
  jobFunction?: { value?: unknown };
  audience?: { value?: unknown };
  funnelStage?: { value?: unknown };
  event?: { value?: unknown } | null;
  eventType?: { value?: unknown } | null;
  season?: { value?: unknown } | null;
  yearPublished?: { value?: unknown } | null;
};

export function normalizeLabel(input: string): string {
  return input
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/&/g, " and ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const sanitizeClassifierTitle = sanitizePolicyClassifierTitle;

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function coerceToAllowed(params: {
  values: string[];
  allowed: string[];
  minScore?: number;
}) {
  const allowed = params.allowed || [];
  const minScore = params.minScore ?? 0.6;
  if (allowed.length === 0) return params.values;

  const normalizedToAllowed = new Map<string, string>();
  const compactNormalizedToAllowed = new Map<string, string>();
  const tokensByAllowed = new Map<string, Set<string>>();
  for (const label of allowed) {
    const norm = normalizeLabel(label);
    if (norm) normalizedToAllowed.set(norm, label);
    if (norm) compactNormalizedToAllowed.set(norm.replace(/\s+/g, ""), label);
    tokensByAllowed.set(label, new Set(norm.split(" ").filter(Boolean)));
  }

  const out: string[] = [];
  for (const raw of params.values) {
    const norm = normalizeLabel(String(raw || ""));
    if (!norm) continue;
    const exact = normalizedToAllowed.get(norm);
    if (exact) {
      out.push(exact);
      continue;
    }
    const compactExact = compactNormalizedToAllowed.get(
      norm.replace(/\s+/g, ""),
    );
    if (compactExact) {
      out.push(compactExact);
      continue;
    }

    const want = new Set(norm.split(" ").filter(Boolean));
    let best: { label: string; score: number } | undefined;
    for (const [label, tokens] of tokensByAllowed.entries()) {
      const score = jaccard(want, tokens);
      if (!best || score > best.score) best = { label, score };
    }
    if (best && best.score >= minScore) out.push(best.label);
  }

  return Array.from(new Set(out));
}

export function coerceSingleAllowed(params: {
  value: string;
  allowed: string[];
  minScore?: number;
}): string | undefined {
  const [best] = coerceToAllowed({
    values: [params.value],
    allowed: params.allowed,
    minScore: params.minScore,
  });
  return best;
}

export function normalizeUsage(
  usage: unknown,
): Record<string, number> | undefined {
  if (!usage || typeof usage !== "object") return undefined;
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(usage)) {
    const num = Number(value);
    if (Number.isFinite(num)) out[key] = num;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function toLangSmithChatInput(prompt: string) {
  return {
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };
}

export function toLangSmithChatOutput(result: {
  object?: unknown;
  usage?: unknown;
  text?: string;
}) {
  const usageMetadata = normalizeUsage(result.usage);
  const structured =
    result.object !== undefined && result.object !== null
      ? JSON.stringify(result.object, null, 2)
      : result.text || "";
  const output: Record<string, unknown> = {
    role: "assistant",
    content: structured,
  };
  if (result.object !== undefined) {
    output.structured_output = result.object;
  }
  if (usageMetadata) {
    output.usage_metadata = usageMetadata;
  }
  return output;
}

export function mergeUsage(
  left?: Record<string, number>,
  right?: Record<string, number>,
): Record<string, number> | undefined {
  if (!left && !right) return undefined;
  const merged: Record<string, number> = { ...(left || {}) };
  for (const [key, value] of Object.entries(right || {})) {
    merged[key] = (merged[key] || 0) + value;
  }
  return merged;
}

function formatReasoningValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "none";
  }
  if (value === null || value === undefined) {
    return "none";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

export function appendFinalReasoningSnapshot(
  reasoning: string | undefined,
  classification: ClassificationSnapshot,
  overriddenByHuman: string[],
): string {
  const finalFields: Array<[string, unknown]> = [
    ["assetType", classification.assetType?.value],
    ["assetSubType", classification.assetSubType?.value],
    ["schemaType", classification.schemaType?.value],
    ["product", classification.product?.value],
    ["topic", classification.topic?.value],
    ["useCases", classification.useCases?.value],
    ["industry", classification.industry?.value],
    ["companySize", classification.companySize?.value],
    ["region", classification.region?.value],
    ["language", classification.language?.value],
    ["usageRights", classification.usageRights?.value],
    ["jobLevel", classification.jobLevel?.value],
    ["jobFunction", classification.jobFunction?.value],
    ["audience", classification.audience?.value],
    ["funnelStage", classification.funnelStage?.value],
    ["event", classification.event?.value],
    ["eventType", classification.eventType?.value],
    ["season", classification.season?.value],
    ["yearPublished", classification.yearPublished?.value],
  ];
  const snapshotLines = finalFields.map(([field, value]) => {
    const sourceTag = overriddenByHuman.includes(field)
      ? "[FINAL; HUMAN]"
      : "[FINAL]";
    const sourceReason = overriddenByHuman.includes(field)
      ? "final stored value after human correction"
      : "final stored value after post-processing";
    return `${field}: ${sourceTag} ${formatReasoningValue(value)} — ${sourceReason}`;
  });
  return [reasoning?.trim(), "FINAL OUTPUT SNAPSHOT", ...snapshotLines]
    .filter(Boolean)
    .join("\n");
}

export function pickGeneralLabel(
  allowed: string[] | undefined,
  candidates: string[],
): string | null {
  if (!allowed?.length) return null;
  const normalized = new Map(
    allowed.map((label) => [normalizeLabel(label), label] as const),
  );
  for (const candidate of candidates) {
    const hit = normalized.get(normalizeLabel(candidate));
    if (hit) return hit;
  }
  return null;
}

export function inferCompanySizeFromContext(params: {
  title?: string;
  textContent: string;
  structuredHeadings?: string[];
  bodySummary?: string;
}): string | null {
  const haystack = [
    params.title || "",
    params.structuredHeadings?.join(" ") || "",
    params.bodySummary || "",
    params.textContent.slice(0, 4000),
  ]
    .join(" ")
    .toLowerCase();

  const score = (patterns: Array<[RegExp, number]>) =>
    patterns.reduce(
      (total, [pattern, weight]) =>
        total + (pattern.test(haystack) ? weight : 0),
      0,
    );

  const enterpriseScore = score([
    [/\benterprise\b/, 3],
    [/\bfortune\s*500\b/, 3],
    [/\bglobal\b/, 2],
    [/\bat scale\b/, 2],
    [/\bgovernance\b/, 2],
    [/\bcompliance\b/, 2],
    [/\bmulti-?brand\b/, 2],
    [/\bcomplex\b/, 1],
    [/\bsecurity\b/, 1],
    [/\bregional teams\b|\bmultiple markets\b|\blocalization at scale\b/, 1],
  ]);
  const commercialScore = score([
    [/\bmid-?market\b/, 3],
    [/\bcommercial\b/, 2],
    [/\bgrowing teams?\b/, 2],
    [/\bscale-?up\b/, 2],
    [/\bexpanding teams?\b/, 1],
    [/\bregional business(?:es)?\b/, 1],
    [/\bfast-?growing\b/, 1],
  ]);
  const smbScore = score([
    [/\bsmall business\b|\bsmb\b/, 3],
    [/\bstartup\b/, 2],
    [/\bfounder\b/, 2],
    [/\bsmall teams?\b/, 2],
    [
      /\bfreelancer\b|\bcontractor\b|\bone-?person\b|\bone man band\b|\bsolo\b/,
      1,
    ],
  ]);

  const ranked = [
    { label: "Enterprise (>$500M revenue)", score: enterpriseScore },
    { label: "Commercial ($10M - $500M revenue)", score: commercialScore },
    { label: "Small business (<$10M)", score: smbScore },
  ].sort((left, right) => right.score - left.score);

  if (ranked[0].score < 2) return null;
  if (ranked[0].score === ranked[1].score) return null;
  return ranked[0].label;
}
