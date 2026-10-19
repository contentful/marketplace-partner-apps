// Type refactor epoch: 2026-04-01 — all explicit `any` annotations removed
// across the API layer and scripts. No policy values or logic changed.
export const CLASSIFIER_POLICY_VERSION = "2026-03-26-enterprise-v27";

export const BLOG_LIKE_CONTENT_TYPES = [
  "pageLongFormSeo",
  "longFormSeo",
  "pageBlogPost",
  "blogPost",
  "pageGlossary",
  "glossary",
] as const;

export const INTERNAL_TITLE_PATTERNS = [
  /\s*[[(](?:churned|deprecated|sunset|archived)[\])]\s*/gi,
  /\s*[[(](?:replaced with translated version|translated version|internal only)[\])]\s*/gi,
];

export const MULTISELECT_LIMITS = {
  default: {
    product: 2,
    jobLevel: 3,
    jobFunction: 3,
    audience: 3,
    topic: 3,
    useCases: 3,
    industry: 2,
  },
  blogLike: {
    product: 2,
    jobLevel: 4,
    jobFunction: 4,
    audience: 3,
    topic: 4,
    useCases: 4,
    industry: 2,
  },
} as const;

export const CONFIDENCE_CALIBRATION_MINIMUMS = {
  fieldProfileSampleSize: 15,
  fieldBandSampleSize: 5,
  overallProfileSampleSize: 25,
  overallBandSampleSize: 10,
} as const;

// Govern the exact fields that participate in overall and semantic review
// confidence so calibration changes do not live only inside runtime code.
export const CLASSIFIER_CONFIDENCE_SUMMARY_FIELDS = [
  "assetType",
  "assetSubType",
  "product",
  "jobLevel",
  "jobFunction",
  "audience",
  "topic",
  "useCases",
  "funnelStage",
  "industry",
  "companySize",
  "region",
  "language",
  "usageRights",
] as const;

export const CLASSIFIER_SEMANTIC_CONFIDENCE_FIELDS = [
  "topic",
  "jobLevel",
  "jobFunction",
  "useCases",
  "funnelStage",
  "industry",
] as const;

export const CLASSIFIER_EXECUTION_PROFILES = {
  default: {
    useExternalNlp: true,
    companyLookupMode: "full",
    useDynamicFewShot: true,
  },
  interactive: {
    useExternalNlp: false,
    companyLookupMode: "cache-only",
    useDynamicFewShot: false,
  },
} as const;

// High-structure content types get very little value from dynamic correction
// retrieval during bulk reruns compared with the prompt/time cost it adds.
export const BATCH_FEW_SHOT_DISABLED_CONTENT_TYPES = [
  "pageCaseStudy",
  "caseStudy",
] as const;

export const BATCH_FACT_CONTENT_LIMITS = {
  pageCaseStudy: 1200,
  caseStudy: 1200,
} as const;

export type ClassifierExecutionMode =
  keyof typeof CLASSIFIER_EXECUTION_PROFILES;

export function isBlogLikeContentType(contentType: string): boolean {
  return (BLOG_LIKE_CONTENT_TYPES as readonly string[]).includes(contentType);
}

export function sanitizeClassifierTitle(input?: string): string {
  if (!input) return "";

  let output = input;
  for (const pattern of INTERNAL_TITLE_PATTERNS) {
    output = output.replace(pattern, " ");
  }

  return output.replace(/\s+/g, " ").trim();
}
