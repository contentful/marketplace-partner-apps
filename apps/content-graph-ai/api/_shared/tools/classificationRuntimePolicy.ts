import type { Logger } from "../types.js";
import type { ContentSignals } from "../utils/contentSignals.js";
import type { CompanyData } from "../utils/companyCache.js";
import { deriveIndustryAndSize } from "../utils/companyCache.js";
import {
  applyConfidenceCalibration,
  computeConfidenceSummary,
} from "../utils/confidenceCalibration.js";
import { applyFeedbackOverrides } from "../utils/feedbackStore.js";
import type { ContentTypeProfile } from "../config/contentTypeProfiles.js";
import {
  COMPETITIVE_CATEGORY_ALTERNATIVE_LABELS,
  COMPETITIVE_NAMED_COMPETITOR_LABELS,
  COMPETITIVE_POSITIONING_TYPE_LABELS,
} from "../config/taxonomyDefinition.js";
import {
  appendFinalReasoningSnapshot,
  inferCompanySizeFromContext,
} from "../utils/classificationSupport.js";
import {
  normalizeJobFunctionFromTitles,
  normalizeJobLevelFromTitles,
} from "../utils/jobRoleNormalization.js";
import type {
  AllowedTaxonomyLabels,
  ClassificationResult,
} from "./classificationTool.js";

type ContentQualityLevel =
  | "TITLE_ONLY"
  | "TITLE_HEADINGS"
  | "PARTIAL_BODY"
  | "FULL_BODY"
  | "SUSPICIOUS_BODY";

type RuntimeAsset = {
  id: string;
  title?: string;
  contentType: string;
  textContent: string;
  slug?: string;
};

type RuntimePolicyParams = {
  classification: ClassificationResult;
  asset: RuntimeAsset;
  assetTitle: string;
  signals?: ContentSignals;
  companyData?: Map<string, CompanyData>;
  allowedLabels?: AllowedTaxonomyLabels;
  profile: ContentTypeProfile | null;
  contentQuality: ContentQualityLevel;
  semanticCeiling: number;
  bodyCharCount: number;
  suspiciousEvidenceReasons: string[];
  logger?: Logger;
};

type ReviewFinalizationParams = {
  classification: ClassificationResult;
  assetId: string;
  contentQuality: ContentQualityLevel;
  suspiciousEvidenceReasons: string[];
  consistencyWarnings: string[];
  openQuestionFlags: number[];
  logger?: Logger;
};

const COMPETITIVE_NAMED_COMPETITOR_SET = new Set(
  COMPETITIVE_NAMED_COMPETITOR_LABELS,
);
const COMPETITIVE_CATEGORY_ALTERNATIVE_SET = new Set(
  COMPETITIVE_CATEGORY_ALTERNATIVE_LABELS,
);
const COMPETITIVE_POSITIONING_TYPE_SET = new Set(
  COMPETITIVE_POSITIONING_TYPE_LABELS,
);
const DEFAULT_SWIT_INDUSTRY = "Software, IT & Technology";

const BROAD_EDUCATIONAL_TYPES = new Set([
  "pageLongFormSeo",
  "longFormSeo",
  "pageBlogPost",
  "blogPost",
  "pageGlossary",
  "glossary",
]);
const CASE_STUDY_TYPES = new Set(["pageCaseStudy", "caseStudy"]);
const EDUCATIONAL_TOPIC_JOB_FUNCTION_MAP: Record<string, string> = {
  SEO: "Marketing",
  "Digital experiences": "Marketing",
  Personalization: "Marketing",
  "Web Development": "Web Development",
};

const WEBINAR_PATTERN =
  /\b(webinar|on-demand webinar|ondemand webinar|watch webinar|webinar recap|webinar recording|register for the webinar)\b/i;

const AUDIENCE_PATTERNS = {
  prospect:
    /\b(prospective customers?|prospects?|buyers? evaluating|teams evaluating|organizations evaluating|for buyers)\b/i,
  directCustomer:
    /\b(existing customers?|current customers?|for customers?|customer portal|customer onboarding|customer success|support customers?)\b/i,
  solutionPartner:
    /\b(solution partners?|agency partners?|services partners?|implementation partners?|system integrators?)\b/i,
  techPartner:
    /\b(tech(?:nology)? partners?|platform partners?|isv partners?|integration partners?|build on contentful|marketplace partners?)\b/i,
  community:
    /\b(contentful community|developer community|community meetup|community event|champions program|contributors?)\b/i,
  internal:
    /\b(internal only|employees only|for employees|internal teams?|join our team|open roles|we(?:'|’)re hiring|careers?)\b/i,
} as const;

const EXPLICIT_INDUSTRY_PATTERNS: Array<[string, RegExp]> = [
  [
    "Retail & ecommerce",
    /\b(retail|e-?commerce|commerce merchant|shopping experience|storefront|merchandis(?:e|ing))\b/i,
  ],
  [
    "Financial Services",
    /\b(financial services|banking|bank|fintech|insurance|wealth management|payments?)\b/i,
  ],
  [
    "Media & Telecommunications",
    /\b(media|publisher|publishing|newsroom|broadcast|streaming|telecommunications?|telecom)\b/i,
  ],
  [
    "Automotive",
    /\b(automotive|auto maker|vehicle|dealer network|mobility)\b/i,
  ],
  [
    "Travel & Hospitality",
    /\b(travel|hospitality|hotel|airline|destination|guest experience)\b/i,
  ],
  [
    "Health & Wellness",
    /\b(healthcare|health care|health system|pharma|pharmaceutical|life sciences?|medtech|wellness)\b/i,
  ],
  [
    "Manufacturing & Utilities",
    /\b(manufacturing|industrial|factory|utilities?|energy provider|supply chain operations)\b/i,
  ],
  [
    "Government & Public Services",
    /\b(government|public sector|federal|state agency|municipal|citizen services)\b/i,
  ],
  [
    "Education",
    /\b(education|higher education|university|school district|student experience)\b/i,
  ],
  ["Non-profit", /\b(non-profit|nonprofit|foundation|charity|donor)\b/i],
  ["Entertainment", /\b(entertainment|gaming|games|sports media)\b/i],
  [
    "Transportation & Logistics",
    /\b(logistics|transportation|shipping|freight|last mile|fleet)\b/i,
  ],
  [
    "Business services",
    /\b(consulting|professional services|business services|b2b services)\b/i,
  ],
  [
    "Consumer Packaged Goods (CPG)",
    /\b(cpg|consumer packaged goods|food brand|beverage brand|household brand)\b/i,
  ],
  [
    "Quick Service Restaurants (QSR)",
    /\b(qsr|quick service restaurant|restaurant chain|drive[- ]thru)\b/i,
  ],
  [
    DEFAULT_SWIT_INDUSTRY,
    /\b(software|saas|digital experience platform|headless cms|composable content|api-first|cloud-native|developer platform)\b/i,
  ],
];

const COMPETITOR_ALIAS_MAP: Record<string, string> = {
  "ab tasty": "AB Tasty",
  "adobe experience manager": "Adobe Experience Manager",
  aem: "Adobe Experience Manager",
  "adobe target": "Adobe Target",
  "agility cms": "Agility CMS",
  bloomreach: "Bloomreach",
  contentstack: "Contentstack",
  "dynamic yield": "Dynamic Yield",
  hygraph: "Hygraph",
  insider: "Insider",
  kameleoon: "Kameleoon",
  "kontent ai": "Kontent.ai",
  "kontent.ai": "Kontent.ai",
  monetate: "Monetate",
  optimizely: "Optimizely",
  sanity: "Sanity",
  sitecore: "Sitecore",
  storyblok: "Storyblok",
  umbraco: "Umbraco",
  vwo: "VWO",
  webflow: "Webflow",
  "legacy cms": "Legacy CMS",
  "monolithic cms": "Monolithic CMS",
  "monolithic ecommerce tool": "Monolithic Ecommerce Platform",
  "monolithic ecommerce platform": "Monolithic Ecommerce Platform",
};

function canonicalizeCompetitorLabel(value: unknown): string | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const alias = COMPETITOR_ALIAS_MAP[raw.toLowerCase()];
  if (alias) return alias;

  for (const label of COMPETITIVE_NAMED_COMPETITOR_LABELS) {
    if (label.toLowerCase() === raw.toLowerCase()) return label;
  }
  for (const label of COMPETITIVE_CATEGORY_ALTERNATIVE_LABELS) {
    if (label.toLowerCase() === raw.toLowerCase()) return label;
  }
  return null;
}

function hasCompetitiveFraming(text: string): boolean {
  return /\b(vs\.?|versus|alternative to|replace|replacing|switch from|move away from|migrate from|replatform from|legacy cms|monolithic cms|monolithic ecommerce)\b/i.test(
    text,
  );
}

export function normalizeCompetitivePositioning(params: {
  competitivePositioning?: {
    mentionsCompetitors?: boolean;
    competitorNames?: string[];
    competitorCategories?: string[];
    positioningType?: string;
  } | null;
  title?: string;
  slug?: string;
  textContent?: string;
}): {
  mentionsCompetitors: boolean;
  competitorNames: string[];
  competitorCategories: string[];
  positioningType: (typeof COMPETITIVE_POSITIONING_TYPE_LABELS)[number];
} {
  const raw = params.competitivePositioning || {};
  const haystack = [
    params.title || "",
    params.slug || "",
    String(params.textContent || "").slice(0, 12000),
  ].join("\n");
  const hasFraming = hasCompetitiveFraming(haystack);

  const normalizedNamed = Array.from(
    new Set(
      (raw.competitorNames || [])
        .map(canonicalizeCompetitorLabel)
        .filter(
          (label): label is string =>
            Boolean(label) &&
            COMPETITIVE_NAMED_COMPETITOR_SET.has(
          label as (typeof COMPETITIVE_NAMED_COMPETITOR_LABELS)[number],
        ),
        ),
    ),
  );
  const normalizedCategories = Array.from(
    new Set(
      [...(raw.competitorCategories || []), ...(raw.competitorNames || [])]
        .map(canonicalizeCompetitorLabel)
        .filter(
          (label): label is string =>
            Boolean(label) &&
            COMPETITIVE_CATEGORY_ALTERNATIVE_SET.has(
              label as (typeof COMPETITIVE_CATEGORY_ALTERNATIVE_LABELS)[number],
            ),
        ),
    ),
  );

  const allowNamed =
    normalizedNamed.length > 0 &&
    (hasFraming ||
      /(^|[\s/])(sitecore|contentstack|storyblok|sanity|hygraph|kontent\.ai|kontent ai|webflow|umbraco|optimizely|adobe target|adobe experience manager|aem|dynamic yield|ab tasty|vwo|insider|monetate|kameleoon|bloomreach)([\s/]|$)/i.test(
        haystack,
      ));

  const allowCategories =
    normalizedCategories.length > 0 &&
    normalizedCategories.every((label) =>
      haystack.toLowerCase().includes(label.toLowerCase()),
    );

  const competitorNames = allowNamed ? normalizedNamed : [];
  const competitorCategories = allowCategories ? normalizedCategories : [];

  const mentionsCompetitors =
    competitorNames.length > 0 || competitorCategories.length > 0;

  let positioningType: (typeof COMPETITIVE_POSITIONING_TYPE_LABELS)[number] =
    "none";
  if (competitorNames.length > 0 && competitorCategories.length > 0) {
    positioningType = "mixed";
  } else if (competitorNames.length > 0) {
    positioningType = "named-competitor";
  } else if (competitorCategories.length > 0) {
    positioningType = "category-alternative";
  }

  const requestedType = String(raw.positioningType || "").trim();
  if (
    requestedType &&
    COMPETITIVE_POSITIONING_TYPE_SET.has(
      requestedType as (typeof COMPETITIVE_POSITIONING_TYPE_LABELS)[number],
    ) &&
    requestedType !== "none"
  ) {
    if (
      requestedType === "mixed" &&
      competitorNames.length > 0 &&
      competitorCategories.length > 0
    ) {
      positioningType = "mixed";
    } else if (
      requestedType === "named-competitor" &&
      competitorNames.length > 0
    ) {
      positioningType = "named-competitor";
    } else if (
      requestedType === "category-alternative" &&
      competitorCategories.length > 0
    ) {
      positioningType = "category-alternative";
    }
  }

  return {
    mentionsCompetitors,
    competitorNames,
    competitorCategories,
    positioningType,
  };
}

export function normalizeAudienceSelection(params: {
  audience?: string[] | null;
  title?: string;
  slug?: string;
  textContent?: string;
  urlPattern?: string;
  audienceHints?: string[] | null;
}): string[] {
  const hinted = Array.from(
    new Set((params.audienceHints || []).filter(Boolean)),
  );
  if (hinted.length > 0) return hinted;

  const haystack = [
    params.title || "",
    params.slug || "",
    String(params.textContent || "").slice(0, 8000),
  ].join("\n");

  const normalized: string[] = [];
  if (AUDIENCE_PATTERNS.directCustomer.test(haystack)) {
    normalized.push("Direct Customer");
  }
  if (AUDIENCE_PATTERNS.solutionPartner.test(haystack)) {
    normalized.push("Solution / Agency Partner");
  }
  if (AUDIENCE_PATTERNS.techPartner.test(haystack)) {
    normalized.push("Tech / Platform / ISV Partner");
  }
  if (AUDIENCE_PATTERNS.community.test(haystack)) {
    normalized.push("Contentful community");
  }
  if (AUDIENCE_PATTERNS.internal.test(haystack)) {
    normalized.push("Internal");
  }
  if (
    normalized.length === 0 &&
    AUDIENCE_PATTERNS.prospect.test(haystack) &&
    ["pricing", "product", "solution", "resource"].includes(
      String(params.urlPattern || ""),
    )
  ) {
    normalized.push("Prospect");
  }

  return Array.from(new Set(normalized));
}

function detectExplicitIndustryMentions(params: {
  title?: string;
  slug?: string;
  textContent?: string;
}): string[] {
  const haystack = [
    params.title || "",
    params.slug || "",
    String(params.textContent || "").slice(0, 8000),
  ].join("\n");
  return EXPLICIT_INDUSTRY_PATTERNS.filter(([, pattern]) =>
    pattern.test(haystack),
  )
    .map(([label]) => label)
    .filter((value, index, array) => array.indexOf(value) === index);
}

export function normalizeIndustrySelection(params: {
  industry?: string[] | null;
  title?: string;
  slug?: string;
  textContent?: string;
  urlPattern?: string;
  contentType?: string;
  funnelStage?: string;
  industryHints?: string[] | null;
  productValues?: string[] | null;
}): string[] {
  const hinted = Array.from(
    new Set((params.industryHints || []).filter(Boolean)),
  );
  if (hinted.length > 0) return hinted;

  const explicitMentions = detectExplicitIndustryMentions(params).filter(
    (label) => label !== DEFAULT_SWIT_INDUSTRY,
  );

  const normalized = Array.from(
    new Set((params.industry || []).filter(Boolean)),
  ).filter((value) => value !== "General business");

  const urlPattern = String(params.urlPattern || "");
  const contentType = String(params.contentType || "");
  const productValues = params.productValues || [];
  const isBroadEducationalType = BROAD_EDUCATIONAL_TYPES.has(contentType);
  const isEducationalFunnel = [
    "Awareness (TOFU)",
    "Consideration (MOFU)",
  ].includes(String(params.funnelStage || ""));

  if (explicitMentions.length > 0) {
    return explicitMentions.slice(0, 2);
  }

  if (isBroadEducationalType && isEducationalFunnel) {
    return [];
  }

  if (urlPattern === "product" || urlPattern === "pricing") {
    if (
      isGenericPlatformProductPage({
        title: params.title,
        slug: params.slug,
        productValues: productValues,
      })
    ) {
      return [DEFAULT_SWIT_INDUSTRY];
    }
    return normalized.includes(DEFAULT_SWIT_INDUSTRY)
      ? [DEFAULT_SWIT_INDUSTRY]
      : [];
  }

  if (normalized.length <= 1) {
    return normalized;
  }

  return [];
}

export function normalizeJobFunctionSelection(params: {
  jobFunctions?: string[] | null;
  contentType?: string;
  title?: string;
  slug?: string;
  textContent?: string;
  structuredHeadings?: string[] | null;
  productValues?: string[] | null;
}): string[] {
  return normalizeJobFunctionFromTitles({
    current: Array.from(new Set((params.jobFunctions || []).filter(Boolean))),
    fallbackMode: CASE_STUDY_TYPES.has(String(params.contentType || ""))
      ? "empty"
      : "preserve",
    context: {
      title: params.title,
      slug: params.slug,
      structuredHeadings: params.structuredHeadings,
      textContent: params.textContent,
      includeScopedTextEvidence: CASE_STUDY_TYPES.has(
        String(params.contentType || ""),
      ),
    },
  });
}

function getStrictExplicitJobFunctions(params: {
  title?: string;
  slug?: string;
  structuredHeadings?: string[] | null;
}): string[] {
  return normalizeJobFunctionFromTitles({
    current: [],
    fallbackMode: "empty",
    context: {
      title: params.title,
      slug: params.slug,
      structuredHeadings: params.structuredHeadings,
      includeScopedTextEvidence: false,
    },
  });
}

function getHintedTopics(topicHints?: string[] | null): string[] {
  return Array.from(new Set((topicHints || []).filter(Boolean))).slice(0, 3);
}

function getHintedEducationalJobFunctions(
  topicHints?: string[] | null,
): string[] {
  return Array.from(
    new Set(
      getHintedTopics(topicHints)
        .map((topic) => EDUCATIONAL_TOPIC_JOB_FUNCTION_MAP[topic])
        .filter(Boolean),
    ),
  ).slice(0, 3);
}

function mergeEducationalTopicHints(params: {
  currentTopics?: string[] | null;
  topicHints?: string[] | null;
}): string[] {
  return Array.from(
    new Set([
      ...getHintedTopics(params.topicHints),
      ...((params.currentTopics || []).filter(Boolean) as string[]),
    ]),
  ).slice(0, 3);
}

function resolveBroadEducationalJobFunctions(params: {
  title?: string;
  slug?: string;
  structuredHeadings?: string[] | null;
  topicHints?: string[] | null;
}): string[] {
  const explicitJobFunctions = getStrictExplicitJobFunctions({
    title: params.title,
    slug: params.slug,
    structuredHeadings: params.structuredHeadings,
  });
  if (explicitJobFunctions.length > 0) {
    return explicitJobFunctions;
  }
  return getHintedEducationalJobFunctions(params.topicHints);
}

export function normalizeJobLevelSelection(params: {
  jobLevels?: string[] | null;
  contentType?: string;
  title?: string;
  slug?: string;
  textContent?: string;
  structuredHeadings?: string[] | null;
  productValues?: string[] | null;
}): string[] {
  return normalizeJobLevelFromTitles({
    current: Array.from(new Set((params.jobLevels || []).filter(Boolean))),
    context: {
      title: params.title,
      slug: params.slug,
      structuredHeadings: params.structuredHeadings,
      textContent: params.textContent,
      includeScopedTextEvidence: CASE_STUDY_TYPES.has(
        String(params.contentType || ""),
      ),
    },
  });
}

export function normalizeSeasonValue(value: unknown): string | null {
  const text = String(value || "").trim();
  if (!text) return null;
  const matches = Array.from(
    new Set(
      Array.from(text.matchAll(/\b(Spring|Summer|Fall|Winter)\b/gi)).map(
        (match) => {
          const normalized = match[1].toLowerCase();
          return normalized.charAt(0).toUpperCase() + normalized.slice(1);
        },
      ),
    ),
  );
  return matches.length === 1 ? matches[0] : null;
}

export function isWebinarLikeContent(params: {
  title?: string;
  slug?: string;
  textContent?: string;
  structuredHeadings?: string[];
}): boolean {
  const titleAndSlug = `${params.title || ""}\n${params.slug || ""}`;
  if (WEBINAR_PATTERN.test(titleAndSlug)) {
    return true;
  }

  const leadingText = String(params.textContent || "").slice(0, 1800);
  if (WEBINAR_PATTERN.test(leadingText)) {
    return true;
  }

  const headingText = (params.structuredHeadings || []).join("\n");
  return WEBINAR_PATTERN.test(headingText);
}

function isPhysicalEventContent(params: {
  title?: string;
  slug?: string;
  textContent?: string;
}): boolean {
  const haystack = `${params.title || ""}\n${params.slug || ""}\n${params.textContent || ""}`;
  return /\b(in-person|in person|onsite|on-site|venue|booth|expo hall|conference center|hotel|live from|join us in)\b/i.test(
    haystack,
  );
}

export function shouldKeepSeasonTag(params: {
  contentType?: string;
  urlPattern?: string;
  assetSubTypes?: string[];
  title?: string;
  slug?: string;
  textContent?: string;
  structuredHeadings?: string[];
}): boolean {
  if (["pageEvent", "event"].includes(String(params.contentType || ""))) {
    return true;
  }
  const subTypes = new Set(params.assetSubTypes || []);
  if (subTypes.has("Event") || subTypes.has("Webinar")) {
    return true;
  }
  const urlPattern = String(params.urlPattern || "").toLowerCase();
  if (urlPattern === "product" || subTypes.has("Product")) {
    return false;
  }
  const pattern =
    /\b(black friday|cyber monday|holiday|summit|conference|roadshow|campaign|series|webinar|event)\b/i;
  const titleAndSlug = `${params.title || ""}\n${params.slug || ""}`;
  if (pattern.test(titleAndSlug)) {
    return true;
  }
  const leadingText = String(params.textContent || "").slice(0, 1800);
  if (pattern.test(leadingText)) {
    return true;
  }
  const headingText = (params.structuredHeadings || []).join("\n");
  return pattern.test(headingText);
}

export function shouldPrioritizeHumanReview(assetSubTypes: string[]): boolean {
  return assetSubTypes.some((value) =>
    ["Case Study", "Ebook", "Webinar"].includes(value),
  );
}

export function isGenericPlatformProductPage(params: {
  title?: string;
  slug?: string;
  productValues?: string[];
}): boolean {
  const title = String(params.title || "");
  const slug = String(params.slug || "");
  const productValues = params.productValues || [];
  if (!productValues.includes("Platform")) return false;
  const slugOrTitle = `${title}\n${slug}`.toLowerCase();
  if (!/\bplatform\b/.test(slugOrTitle)) return false;
  return !(
    /\b(ai-actions?|analytics|personalization|hosting|marketplace|ecosystem|studio)\b/.test(
      slugOrTitle,
    ) ||
    /\/(?:ai-actions|analytics|personalization|hosting|marketplace|ecosystem|studio)\b/.test(
      slug,
    )
  );
}

export function isHeadlessCmsPlatformContext(params: {
  title?: string;
  slug?: string;
  textContent?: string;
  structuredHeadings?: string[];
}): boolean {
  const haystack = [
    params.title || "",
    params.slug || "",
    (params.structuredHeadings || []).join("\n"),
    String(params.textContent || "").slice(0, 4000),
  ]
    .join("\n")
    .toLowerCase();

  if (/\bheadless\s+cms\b/.test(haystack)) {
    return true;
  }

  const patterns = [
    /\bcomposable content platform\b/,
    /\bcontent platform\b/,
    /\bcontent models?\b/,
    /\bstructured content\b/,
    /\bdeliver everywhere\b/,
    /\bapi[-\s]?first\b/,
    /\bcomposable architecture\b/,
    /\bheadless\b/,
  ];

  let score = 0;
  for (const pattern of patterns) {
    if (pattern.test(haystack)) score++;
  }

  return score >= 2;
}

function hasStrongTitleOrHeadingSignal(params: {
  title?: string;
  slug?: string;
  structuredHeadings?: string[];
  pattern: RegExp;
}): boolean {
  const titleAndSlug = `${params.title || ""}\n${params.slug || ""}`;
  if (params.pattern.test(titleAndSlug)) {
    return true;
  }
  const headingText = (params.structuredHeadings || []).join("\n");
  return params.pattern.test(headingText);
}

export function computeOpenQuestionFlags(params: {
  contentType?: string;
  urlPattern?: string;
}): number[] {
  const contentType = String(params.contentType || "");
  const urlPattern = String(params.urlPattern || "unknown");
  const flags: number[] = [];

  const hasContentTypeUrlConflict =
    (new Set(["pageLongFormSeo", "longFormSeo"]).has(contentType) &&
      urlPattern === "product") ||
    (new Set(["pageBlogPost", "blogPost"]).has(contentType) &&
      urlPattern === "resource") ||
    (new Set(["pageResource", "resource"]).has(contentType) &&
      urlPattern === "blog");

  if (hasContentTypeUrlConflict) {
    flags.push(12);
  }

  return flags;
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value && typeof value === "string") return [value];
  return [];
}

export function normalizeConfidenceValue(value: number | undefined): number {
  const numeric = Number(value || 0);
  return numeric > 1 ? numeric / 100 : numeric;
}

function elevateConfidence(current: number | undefined, floor: number): number {
  return Math.max(normalizeConfidenceValue(current), floor);
}

function normalizeCaseStudyProducts(params: {
  current: string[] | null | undefined;
  title?: string;
  slug?: string;
}): string[] {
  const evidence = [params.title || "", params.slug || ""].join("\n");
  const normalized: string[] = [];

  if (
    /\b(personalization|ninetailed|experiment(?:ation)?|a\/b test)\b/i.test(
      evidence,
    )
  ) {
    normalized.push("Ninetailed (Personalization)");
  }
  if (/\b(ai|artificial intelligence|genai|generative ai)\b/i.test(evidence)) {
    normalized.push("AI");
  }
  if (/\bmarketplace\b/i.test(evidence)) {
    normalized.push("Marketplace");
  }
  if (/\becosystem\b/i.test(evidence)) {
    normalized.push("Ecosystem");
  }
  if (/\bstudio\b/i.test(evidence)) {
    normalized.push("Studio");
  }

  if (normalized.length === 0 || asArray(params.current).includes("Platform")) {
    normalized.unshift("Platform");
  }

  return Array.from(new Set(normalized)).slice(0, 2);
}

export function inferCaseStudyAudienceJobFunctions(text: string): string[] {
  const patterns: Array<[string, RegExp]> = [
    [
      "Marketing",
      /\b(?:for|helps?|helping|enables?|enabled|empowers?)\s+(?:[a-z]+\s+){0,3}(?:marketers?|marketing teams?|demand gen teams?|crm teams?)\b/i,
    ],
    [
      "Content",
      /\b(?:for|helps?|helping|enables?|enabled|empowers?)\s+(?:[a-z]+\s+){0,3}(?:content teams?|content strategists?|content creators?|editors?)\b/i,
    ],
    [
      "Product",
      /\b(?:for|helps?|helping|enables?|enabled|empowers?)\s+(?:[a-z]+\s+){0,3}(?:product teams?|product managers?|product leaders?)\b/i,
    ],
    [
      "Retail / ecommerce",
      /\b(?:for|helps?|helping|enables?|enabled|empowers?)\s+(?:[a-z]+\s+){0,3}(?:ecommerce teams?|retail teams?|commerce teams?|merchandisers?)\b/i,
    ],
    [
      "Engineering",
      /\b(?:for|helps?|helping|enables?|enabled|empowers?)\s+(?:[a-z]+\s+){0,3}(?:engineering teams?|engineers?)\b/i,
    ],
    [
      "Web Development",
      /\b(?:for|helps?|helping|enables?|enabled|empowers?)\s+(?:[a-z]+\s+){0,3}(?:developers?|web teams?|web developers?|front end teams?)\b/i,
    ],
    [
      "IT/Engineering",
      /\b(?:for|helps?|helping|enables?|enabled|empowers?)\s+(?:[a-z]+\s+){0,3}(?:it teams?|security teams?|infrastructure teams?)\b/i,
    ],
    [
      "Sales",
      /\b(?:for|helps?|helping|enables?|enabled|empowers?)\s+(?:[a-z]+\s+){0,3}(?:sales teams?|account executives?|revenue teams?)\b/i,
    ],
  ];

  return patterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([label]) => label)
    .slice(0, 3);
}

export function applyDeterministicRuntimePolicies(
  params: RuntimePolicyParams,
): {
  consistencyWarnings: string[];
  openQuestionFlags: number[];
  lowContentWarning: string | null;
} {
  const {
    classification,
    asset,
    assetTitle,
    signals,
    companyData,
    allowedLabels,
    profile,
    contentQuality,
    semanticCeiling,
    bodyCharCount,
    suspiciousEvidenceReasons,
    logger,
  } = params;

  const isBlogLikeContent = BROAD_EDUCATIONAL_TYPES.has(asset.contentType);

  if (profile) {
    if (profile.assetType) {
      classification.assetType = {
        value: profile.assetType,
        confidence: 0.99,
      };
    }
    if (profile.assetSubType) {
      classification.assetSubType = {
        value: [profile.assetSubType],
        confidence: 0.99,
      };
    }
    if (profile.schemaType) {
      if (!profile.schemaType.aiDecides) {
        classification.schemaType = {
          value: profile.schemaType.default,
          confidence: 0.99,
        };
      } else if (
        profile.schemaType.never?.includes(classification.schemaType?.value)
      ) {
        logger?.warn(
          `[ClassificationTool] schemaType "${classification.schemaType.value}" is forbidden for ${asset.contentType}, resetting to "${profile.schemaType.default}"`,
        );
        classification.schemaType = {
          value: profile.schemaType.default,
          confidence: 0.87,
        };
      }
    }
    if (
      profile.funnelStage?.never?.includes(classification.funnelStage?.value)
    ) {
      const previousStage = classification.funnelStage.value;
      classification.funnelStage = {
        value: profile.funnelStage.default,
        confidence: 0.85,
      };
      logger?.warn(
        `[ClassificationTool] funnelStage "${previousStage}" is in never-list for ${asset.contentType}, resetting to default`,
      );
    }
  }

  if (signals) {
    const ov = signals.override;

    if (ov.schemaType && !profile?.schemaType?.never?.includes(ov.schemaType)) {
      classification.schemaType.value = ov.schemaType;
      classification.schemaType.confidence = 0.97;
    }

    if (ov.assetType) {
      classification.assetType.value = ov.assetType;
      classification.assetType.confidence = 0.97;
    }

    if (ov.assetSubType) {
      classification.assetSubType.value = [ov.assetSubType];
      classification.assetSubType.confidence = 0.95;
    }

    if (ov.season) {
      classification.season = { value: ov.season, confidence: 0.97 };
    }

    if (ov.funnelStage && (signals.hasDemo || signals.hasPricing)) {
      classification.funnelStage.value = ov.funnelStage;
      classification.funnelStage.confidence = 0.95;
    }

    if (ov.yearPublished && classification.yearPublished !== undefined) {
      classification.yearPublished = {
        value: ov.yearPublished,
        confidence: 0.97,
      };
    } else if (ov.yearPublished) {
      (classification as unknown as Record<string, unknown>)["yearPublished"] =
        { value: ov.yearPublished, confidence: 0.97 };
    }

    if (ov.region) {
      classification.region.value = [ov.region];
      classification.region.confidence = 0.97;
    }

    if (signals.audienceHints && signals.audienceHints.length > 0) {
      const hasHintedAudience = signals.audienceHints.some((hint) =>
        classification.audience.value.includes(hint),
      );
      if (!hasHintedAudience) {
        const hintedAudience = Array.from(new Set(signals.audienceHints)).slice(
          0,
          isBlogLikeContent ? 3 : 2,
        );
        classification.audience.value = hintedAudience;
        classification.audience.confidence = 0.92;
      }
    }

    classification.language.value = ov.language;
    classification.language.confidence = 0.99;
    classification.usageRights.value = ov.usageRights;
    classification.usageRights.confidence = 0.99;

    const urlProductMap: Record<string, string> = {
      studio: "Platform",
      "ai-actions": "AI",
      analytics: "Analytics",
      ecosystem: "Ecosystem",
      marketplace: "Marketplace",
      personalization: "Personalization",
      hosting: "Platform",
      platform: "Platform",
    };
    const urlPrimary =
      Object.entries(urlProductMap).find(([segment]) =>
        (asset.slug || "").includes(segment),
      )?.[1] ?? null;

    const validProducts = allowedLabels?.product || [];
    const mentionMatches = signals.mentionedProducts.filter(
      (product) =>
        validProducts.length === 0 || validProducts.includes(product),
    );

    const productList = urlPrimary
      ? [
          urlPrimary,
          ...mentionMatches.filter((product) => product !== urlPrimary),
        ]
      : mentionMatches;

    if (productList.length > 0) {
      classification.product.value = urlPrimary
        ? [
            urlPrimary,
            ...productList.filter((product) => product !== urlPrimary),
          ].slice(0, 2)
        : productList.slice(0, 2);
      classification.product.confidence = urlPrimary ? 0.97 : 0.92;
    }
  }

  if (
    companyData &&
    companyData.size > 0 &&
    profile?.companyEnrichmentApplies
  ) {
    const derived = deriveIndustryAndSize(companyData);
    if (derived.companySize && derived.confidence > 0.6) {
      const validSizes = allowedLabels?.companySize || [];
      const sizeValid =
        validSizes.length === 0 || validSizes.includes(derived.companySize);
      if (sizeValid) {
        classification.companySize.value = [derived.companySize];
        classification.companySize.confidence = derived.confidence;
      }
    }
  }

  const isBroadEducationalType = BROAD_EDUCATIONAL_TYPES.has(asset.contentType);
  const isSeoPillarType = new Set(["pageLongFormSeo", "longFormSeo"]).has(
    asset.contentType,
  );
  const hasExplicitIndustryHint = Boolean(signals?.industryHints?.length);
  const isEducationalFunnel = [
    "Awareness (TOFU)",
    "Consideration (MOFU)",
  ].includes(classification.funnelStage.value);
  const hasStrongCommercialIntent = Boolean(
    signals?.hasDemo || signals?.hasPricing,
  );
  const isFoundationalSeoTitle =
    /\b(what is|guide|simply explained|explained|ultimate guide|definitive guide)\b/i.test(
      assetTitle,
    );
  const swIT = "Software, IT & Technology";

  if (
    isBroadEducationalType &&
    isEducationalFunnel &&
    !hasExplicitIndustryHint
  ) {
    classification.industry.value = [];
    classification.industry.confidence = 0.8;
  }

  if (isSeoPillarType && isFoundationalSeoTitle && !hasStrongCommercialIntent) {
    classification.funnelStage.value = "Awareness (TOFU)";
    classification.funnelStage.confidence = elevateConfidence(
      classification.funnelStage.confidence,
      0.92,
    );
  }

  if (
    isSeoPillarType &&
    classification.funnelStage.value === "Awareness (TOFU)" &&
    classification.schemaType.value === "TechArticle" &&
    signals?.urlPattern !== "docs" &&
    !signals?.hasStepByStep
  ) {
    classification.schemaType.value = "Article";
    classification.schemaType.confidence = elevateConfidence(
      classification.schemaType.confidence,
      0.9,
    );
  }

  if (isSeoPillarType && signals?.topicHints?.length) {
    const mergedTopics = mergeEducationalTopicHints({
      currentTopics: classification.topic.value,
      topicHints: signals.topicHints,
    });
    if (mergedTopics.length > 0) {
      classification.topic.value = mergedTopics;
      classification.topic.confidence = elevateConfidence(
        classification.topic.confidence,
        0.88,
      );
    }
  }

  if (isSeoPillarType && isEducationalFunnel && signals?.topicHints?.length) {
    const hintedJobFunctions = getHintedEducationalJobFunctions(
      signals.topicHints,
    );
    if (hintedJobFunctions.length > 0) {
      classification.jobFunction.value = Array.from(
        new Set([
          ...hintedJobFunctions,
          ...(classification.jobFunction.value || []),
        ]),
      ).slice(0, 3);
      classification.jobFunction.confidence = elevateConfidence(
        classification.jobFunction.confidence,
        0.88,
      );
    }
  }

  if (
    isSeoPillarType &&
    classification.funnelStage.value === "Awareness (TOFU)" &&
    /\bapi\b/i.test(`${assetTitle} ${asset.slug || ""}`) &&
    signals?.urlPattern !== "docs"
  ) {
    classification.jobFunction.value = ["Web Development"];
    classification.jobFunction.confidence = elevateConfidence(
      classification.jobFunction.confidence,
      0.9,
    );
  }

  if (isBroadEducationalType) {
    classification.usageRights.value = "External";
    classification.usageRights.confidence = 0.99;
  }

  const contextualCompanySize = inferCompanySizeFromContext({
    title: assetTitle,
    textContent: asset.textContent,
    structuredHeadings: signals?.structuredContent?.featureHeadings,
    bodySummary: signals?.structuredContent?.bodySummary,
  });
  if (isBroadEducationalType && isEducationalFunnel) {
    classification.companySize.value = contextualCompanySize
      ? [contextualCompanySize]
      : [];
    classification.companySize.confidence = elevateConfidence(
      classification.companySize.confidence,
      contextualCompanySize ? 0.82 : 0.86,
    );
  }

  if (
    (!classification.industry.value?.length ||
      classification.industry.confidence < 0.5) &&
    !(isBroadEducationalType && isEducationalFunnel && !hasExplicitIndustryHint)
  ) {
    classification.industry.value = [];
    classification.industry.confidence = 0.4;
  }

  if (!signals?.override?.schemaType && signals?.urlPattern === "pricing") {
    classification.schemaType.value = "SoftwareApplication";
    classification.schemaType.confidence = 0.93;
  }

  if (!classification.region.value?.length) {
    classification.region.value = ["Global"];
    classification.region.confidence = 0.8;
  }
  if (!classification.language.value) {
    classification.language.value = "EN";
    classification.language.confidence = 0.9;
  }
  if (!classification.usageRights.value) {
    classification.usageRights.value = "External";
    classification.usageRights.confidence = 0.95;
  }
  if (!classification.companySize.value?.length) {
    if (isBroadEducationalType) {
      classification.companySize.value = [];
      classification.companySize.confidence = 0.85;
    } else {
      classification.companySize.value = ["Enterprise (>$500M revenue)"];
      classification.companySize.confidence = 0.7;
    }
  }

  const fullText = `${assetTitle}\n${asset.slug || ""}\n${asset.textContent || ""}`;

  const useCaseValues = asArray(classification.useCases?.value).filter(
    (value) => !["Migration", "Replatforming"].includes(value),
  );
  const migratedTopics = Array.from(
    new Set([
      ...asArray(classification.topic?.value),
      ...asArray(classification.useCases?.value).filter((value) =>
        ["Migration", "Replatforming"].includes(value),
      ),
    ]),
  );
  classification.useCases.value = useCaseValues;
  classification.topic.value = migratedTopics;

  if (
    asArray(classification.product?.value).includes(
      "Ninetailed (Personalization)",
    )
  ) {
    classification.topic.value = asArray(classification.topic?.value).filter(
      (value) => value !== "Personalization",
    );
    classification.useCases.value = asArray(
      classification.useCases?.value,
    ).filter((value) => value !== "Personalization");
  }

  if (
    signals?.isProductPage &&
    !asArray(classification.product?.value).includes(
      "Ninetailed (Personalization)",
    )
  ) {
    classification.useCases.value = asArray(
      classification.useCases?.value,
    ).filter((value) => value !== "Personalization");
  }

  if (
    signals?.isProductPage &&
    asArray(classification.product?.value).includes("Platform")
  ) {
    const strongPersonalizationSignal = hasStrongTitleOrHeadingSignal({
      title: assetTitle,
      slug: asset.slug,
      structuredHeadings: signals?.structuredContent?.featureHeadings,
      pattern:
        /\bpersonali[sz]ation|segment(?:ation)?|targeted experiences?\b/i,
    });
    if (!strongPersonalizationSignal) {
      classification.topic.value = asArray(classification.topic?.value).filter(
        (value) => value !== "Personalization",
      );
      classification.useCases.value = asArray(
        classification.useCases?.value,
      ).filter((value) => value !== "Personalization");
    }

    const strongExperimentationSignal = hasStrongTitleOrHeadingSignal({
      title: assetTitle,
      slug: asset.slug,
      structuredHeadings: signals?.structuredContent?.featureHeadings,
      pattern: /\bexperimentation|experiment|a\/b test|ab test|multivariate\b/i,
    });
    if (!strongExperimentationSignal) {
      classification.useCases.value = asArray(
        classification.useCases?.value,
      ).filter((value) => value !== "Experimentation");
    }
  }

  if (
    isWebinarLikeContent({
      title: assetTitle,
      slug: asset.slug,
      textContent: fullText,
      structuredHeadings: signals?.structuredContent?.featureHeadings,
    })
  ) {
    classification.assetSubType.value = ["Webinar"];
    classification.assetSubType.confidence = elevateConfidence(
      classification.assetSubType.confidence,
      0.95,
    );
  } else if (
    ["pageEvent", "event"].includes(asset.contentType) &&
    isPhysicalEventContent({
      title: assetTitle,
      slug: asset.slug,
      textContent: fullText,
    })
  ) {
    classification.assetSubType.value = ["Event"];
    classification.assetSubType.confidence = elevateConfidence(
      classification.assetSubType.confidence,
      0.95,
    );
  }

  if (CASE_STUDY_TYPES.has(asset.contentType)) {
    classification.funnelStage.value = "Consideration (MOFU)";
    classification.funnelStage.confidence = elevateConfidence(
      classification.funnelStage.confidence,
      0.95,
    );
    classification.product.value = normalizeCaseStudyProducts({
      current: classification.product?.value,
      title: assetTitle,
      slug: asset.slug,
    });
    classification.product.confidence = elevateConfidence(
      classification.product.confidence,
      0.94,
    );
  }

  if (/\bgdpr\b/i.test(fullText) && !signals?.override?.region) {
    classification.region.value = ["Global"];
    classification.region.confidence = elevateConfidence(
      classification.region.confidence,
      0.92,
    );
  }

  const normalizedSeason = normalizeSeasonValue(classification.season?.value);
  if (
    normalizedSeason &&
    shouldKeepSeasonTag({
      contentType: asset.contentType,
      urlPattern: signals?.urlPattern,
      assetSubTypes: classification.assetSubType.value,
      title: assetTitle,
      slug: asset.slug,
      textContent: fullText,
      structuredHeadings: signals?.structuredContent?.featureHeadings,
    })
  ) {
    classification.season = {
      value: normalizedSeason,
      confidence: elevateConfidence(classification.season?.confidence, 0.92),
    };
  } else {
    classification.season = undefined;
  }

  if (
    /\b(transform|transformation|strategic|strategy|executive|leadership)\b/i.test(
      fullText,
    ) &&
    !classification.jobLevel.value.includes("Director")
  ) {
    classification.jobLevel.value = Array.from(
      new Set(["Director", ...classification.jobLevel.value]),
    ).slice(0, 3);
    classification.jobLevel.confidence = elevateConfidence(
      classification.jobLevel.confidence,
      0.86,
    );
  }

  if (
    signals?.isProductPage &&
    isGenericPlatformProductPage({
      title: assetTitle,
      slug: asset.slug,
      productValues: asArray(classification.product?.value),
    })
  ) {
    classification.product.value = ["Platform"];
    classification.product.confidence = elevateConfidence(
      classification.product.confidence,
      0.97,
    );

    if (
      isHeadlessCmsPlatformContext({
        title: assetTitle,
        slug: asset.slug,
        textContent: asset.textContent,
        structuredHeadings: signals?.structuredContent?.featureHeadings,
      })
    ) {
      classification.topic.value = ["Headless CMS"];
      classification.topic.confidence = elevateConfidence(
        classification.topic.confidence,
        0.92,
      );
    }

    if (!hasExplicitIndustryHint) {
      classification.industry.value = [swIT];
      classification.industry.confidence = elevateConfidence(
        classification.industry.confidence,
        0.9,
      );
    }
  }

  classification.jobFunction.value = CASE_STUDY_TYPES.has(asset.contentType)
    ? inferCaseStudyAudienceJobFunctions(fullText)
    : normalizeJobFunctionSelection({
        jobFunctions: classification.jobFunction.value,
        contentType: asset.contentType,
        title: assetTitle,
        slug: asset.slug,
        textContent: fullText,
        structuredHeadings: signals?.structuredContent?.featureHeadings,
        productValues: classification.product.value,
      });
  if (isBroadEducationalType && isEducationalFunnel) {
    classification.jobFunction.value = resolveBroadEducationalJobFunctions({
      title: assetTitle,
      slug: asset.slug,
      structuredHeadings: signals?.structuredContent?.featureHeadings,
      topicHints: signals?.topicHints,
    });
    classification.jobFunction.confidence = elevateConfidence(
      classification.jobFunction.confidence,
      classification.jobFunction.value.length > 0 ? 0.88 : 0.84,
    );
  }
  classification.jobLevel.value = normalizeJobLevelSelection({
    jobLevels: classification.jobLevel.value,
    contentType: asset.contentType,
    title: assetTitle,
    slug: asset.slug,
    textContent: fullText,
    structuredHeadings: CASE_STUDY_TYPES.has(asset.contentType)
      ? []
      : signals?.structuredContent?.featureHeadings,
    productValues: classification.product.value,
  });

  const consistencyWarnings: string[] = [];
  const funnelStage = classification.funnelStage?.value;
  const audienceValues = classification.audience?.value ?? [];
  const assetType = classification.assetType?.value;
  const schemaType = classification.schemaType?.value;
  const productValues = classification.product?.value ?? [];

  if (
    funnelStage === "Retention" &&
    !audienceValues.includes("Direct Customer")
  ) {
    consistencyWarnings.push(
      'funnelStage=Retention but audience does not include "Direct Customer" — retention content is for existing users',
    );
  }

  if (
    funnelStage === "Awareness (TOFU)" &&
    audienceValues.length === 1 &&
    audienceValues[0] === "Internal"
  ) {
    consistencyWarnings.push(
      "funnelStage=Awareness (TOFU) with audience=Internal — TOFU pages are typically prospect-facing",
    );
  }

  if (
    assetType === "Video" &&
    schemaType &&
    !["VideoObject", "Event", "PodcastEpisode"].includes(schemaType)
  ) {
    consistencyWarnings.push(
      `assetType=Video but schemaType="${schemaType}" — expected VideoObject or Event`,
    );
  }

  if (assetType === "Audio" && schemaType && schemaType !== "PodcastEpisode") {
    consistencyWarnings.push(
      `assetType=Audio but schemaType="${schemaType}" — expected PodcastEpisode`,
    );
  }

  if (signals?.isProductPage && productValues.length === 0) {
    consistencyWarnings.push(
      "isProductPage=true but product field is empty — product pages should always have a product tag",
    );
  }

  if (schemaType === "DigitalDocument" && signals?.urlPattern !== "resource") {
    consistencyWarnings.push(
      `schemaType=DigitalDocument on a non-resource page (urlPattern="${signals?.urlPattern}") — DigitalDocument is only valid for download-only pages`,
    );
  }

  if (consistencyWarnings.length > 0) {
    logger?.warn(
      `⚠️  [ClassificationTool] Consistency warnings for ${asset.id}`,
      {
        warnings: consistencyWarnings,
      },
    );
    (classification as unknown as Record<string, unknown>)[
      "consistencyWarnings"
    ] = consistencyWarnings;
  }

  const openQuestionFlags = computeOpenQuestionFlags({
    contentType: asset.contentType,
    urlPattern: signals?.urlPattern,
  });

  if (openQuestionFlags.length > 0) {
    (classification as unknown as Record<string, unknown>)[
      "openQuestionFlags"
    ] = openQuestionFlags;
    logger?.info(
      `❓ [ClassificationTool] Open question flags for ${asset.id}: ${openQuestionFlags.join(", ")}`,
    );
  }

  const fieldsToCap = [
    "topic",
    "useCases",
    "jobLevel",
    "jobFunction",
    "industry",
    "audience",
    "product",
    "companySize",
    "funnelStage",
    "region",
    "event",
    "eventType",
    "season",
    "yearPublished",
  ] as const;

  const classificationRecord = classification as unknown as Record<
    string,
    { value: unknown; confidence: number }
  >;
  for (const field of fieldsToCap) {
    if (
      classificationRecord[field] &&
      typeof classificationRecord[field].confidence === "number"
    ) {
      const normalized = normalizeConfidenceValue(
        classificationRecord[field].confidence,
      );
      if (normalized > semanticCeiling) {
        classificationRecord[field].confidence = semanticCeiling;
      }
    }
  }

  let lowContentWarning: string | null = null;
  if (
    contentQuality === "TITLE_ONLY" ||
    contentQuality === "TITLE_HEADINGS" ||
    contentQuality === "SUSPICIOUS_BODY"
  ) {
    const evidenceDesc =
      contentQuality === "TITLE_ONLY"
        ? "title only"
        : contentQuality === "TITLE_HEADINGS"
          ? "title + headings only"
          : `suspicious body text (${suspiciousEvidenceReasons.join("; ")})`;
    lowContentWarning =
      `Classification based on ${evidenceDesc} (${bodyCharCount} chars body) — ` +
      `semantic fields are estimates. Confidence capped at ${Math.round(semanticCeiling * 100)}%.`;
    (classification as unknown as Record<string, unknown>)[
      "lowContentWarning"
    ] = lowContentWarning;
    logger?.warn(
      `⚠️  [ClassificationTool] Low content: "${assetTitle}" has ${bodyCharCount} chars body — semantic confidence capped at ${Math.round(semanticCeiling * 100)}%`,
    );
  }

  return {
    consistencyWarnings,
    openQuestionFlags,
    lowContentWarning,
  };
}

export function finalizeClassificationReviewState(
  params: ReviewFinalizationParams,
): {
  weakestSemantic: number;
  reviewReasons: string[];
  confidenceCalibration: ReturnType<typeof applyConfidenceCalibration>;
  overriddenByHuman: string[];
} {
  const {
    classification,
    assetId,
    contentQuality,
    suspiciousEvidenceReasons,
    consistencyWarnings,
    openQuestionFlags,
    logger,
  } = params;

  let confidenceCalibration = applyConfidenceCalibration(
    classification as unknown as Record<string, unknown>,
  );
  // eslint-disable-next-line no-useless-assignment
  let { weakestSemantic, needsReview, reviewReasons, calibrationMetadata } =
    computeConfidenceSummary(
      classification as unknown as Record<string, unknown>,
      confidenceCalibration,
    );

  const overriddenByHuman = applyFeedbackOverrides(
    assetId,
    classification as unknown as Record<string, { value?: string | string[]; confidence?: number } | null | undefined>,
  );
  if (overriddenByHuman.length > 0) {
    logger?.info(
      `🧑‍💼 [ClassificationTool] Human corrections applied for ${assetId}`,
      { fields: overriddenByHuman },
    );
  }

  confidenceCalibration = applyConfidenceCalibration(
    classification as unknown as Record<string, unknown>,
    { skipFields: overriddenByHuman },
  );
  ({ weakestSemantic, needsReview, reviewReasons, calibrationMetadata } =
    computeConfidenceSummary(
      classification as unknown as Record<string, unknown>,
      confidenceCalibration,
    ));

  const reviewEscalations: string[] = [];
  if (contentQuality === "SUSPICIOUS_BODY") {
    reviewEscalations.push(
      `suspicious evidence footprint (${suspiciousEvidenceReasons.join("; ")})`,
    );
  }
  if (consistencyWarnings.length > 0) {
    reviewEscalations.push(
      `consistency warnings present (${consistencyWarnings.length})`,
    );
  }
  if (openQuestionFlags.length > 0) {
    reviewEscalations.push(
      `open question flags present (${openQuestionFlags.join(", ")})`,
    );
  }
  if (shouldPrioritizeHumanReview(classification.assetSubType?.value || [])) {
    reviewEscalations.push(
      `human review prioritized for ${classification.assetSubType.value.join(", ")}`,
    );
  }

  confidenceCalibration = calibrationMetadata;
  classification.overallConfidence = computeConfidenceSummary(
    classification as unknown as Record<string, unknown>,
    confidenceCalibration,
  ).overallConfidence;
  classification.needsReview = needsReview || reviewEscalations.length > 0;
  reviewReasons = [...reviewReasons, ...reviewEscalations];
  classification.reasoning = appendFinalReasoningSnapshot(
    classification.reasoning,
    classification as ClassificationResult,
    overriddenByHuman,
  );
  const classificationExtra = classification as unknown as Record<
    string,
    unknown
  >;
  classificationExtra["reviewReasons"] = reviewReasons;
  classificationExtra["confidenceCalibration"] = confidenceCalibration;

  return {
    weakestSemantic,
    reviewReasons,
    confidenceCalibration,
    overriddenByHuman,
  };
}
