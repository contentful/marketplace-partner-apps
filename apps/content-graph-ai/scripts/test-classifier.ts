#!/usr/bin/env tsx
import "dotenv/config";
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.production.local", override: false });

import * as fs from "fs";
import * as path from "path";
import {
  BATCH_FACT_CONTENT_LIMITS,
  BATCH_FEW_SHOT_DISABLED_CONTENT_TYPES,
  CLASSIFIER_POLICY_VERSION,
  CLASSIFIER_SEMANTIC_CONFIDENCE_FIELDS,
} from "../api/_shared/config/classifierPolicy.js";
import {
  JOB_FUNCTION_RULES,
  JOB_LEVEL_RULES,
} from "../api/_shared/config/jobRoleNormalization.js";
import {
  COMPETITIVE_CATEGORY_ALTERNATIVE_LABELS,
  COMPETITIVE_NAMED_COMPETITOR_LABELS,
  COMPETITIVE_POSITIONING_TYPE_LABELS,
} from "../api/_shared/config/taxonomyDefinition.js";
import { CLASSIFIER_PROMPT_VERSION } from "../api/_shared/config/classifierPipeline.js";
import { loadContentTypeProfile } from "../api/_shared/config/contentTypeProfiles.js";
import { buildSubjectivePrompt } from "../api/_shared/prompts/classifierPrompts.js";
import {
  applyDeterministicRuntimePolicies,
  finalizeClassificationReviewState,
} from "../api/_shared/tools/classificationRuntimePolicy.js";
import type { ClassificationResult } from "../api/_shared/tools/classificationTool.js";
import {
  coerceToAllowed,
  sanitizeClassifierTitle,
} from "../api/_shared/utils/classificationSupport.js";
import { extractContentSignals } from "../api/_shared/utils/contentSignals.js";

type FieldExpectation = {
  value: string | string[];
  confidence?: number;
};

type ExpectedField =
  | "assetType"
  | "assetSubType"
  | "schemaType"
  | "funnelStage"
  | "product"
  | "topic"
  | "industry"
  | "audience"
  | "jobLevel"
  | "jobFunction"
  | "language"
  | "usageRights"
  | "region"
  | "companySize";

type ClassifierFixture = {
  id: string;
  description: string;
  input: {
    entryId: string;
    title: string;
    contentType: string;
    slug: string;
    textSnippet: string;
  };
  expected: Partial<Record<ExpectedField, FieldExpectation>>;
  expectedSignals?: Partial<{
    urlPattern: string;
    isProductPage: boolean;
    hasDemo: boolean;
    hasPricing: boolean;
    hasVideo: boolean;
    hasDownload: boolean;
    hasStepByStep: boolean;
    detectedLanguage: "EN" | "FR" | "DE";
    overrideSchemaType: string | null;
    overrideFunnelStage: string | null;
    topicHints: string[];
  }>;
  recordedAt?: string;
};

type TestResult = {
  id: string;
  passed: boolean;
  failures: string[];
};

type MockClassification = {
  assetType: { value: string; confidence: number };
  assetSubType: { value: string[]; confidence: number };
  schemaType: { value: string; confidence: number };
  product: { value: string[]; confidence: number };
  jobLevel: { value: string[]; confidence: number };
  jobFunction: { value: string[]; confidence: number };
  audience: { value: string[]; confidence: number };
  topic: { value: string[]; confidence: number };
  useCases: { value: string[]; confidence: number };
  funnelStage: { value: string; confidence: number };
  industry: { value: string[]; confidence: number };
  companySize: { value: string[]; confidence: number };
  region: { value: string[]; confidence: number };
  language: { value: string; confidence: number };
  usageRights: { value: string; confidence: number };
  competitivePositioning: {
    mentionsCompetitors: boolean;
    competitorNames?: string[];
    competitorCategories?: string[];
    positioningType?: string;
  };
  reasoning?: string;
  overallConfidence?: number;
  needsReview?: boolean;
};

const FIXTURE_FILE = path.resolve("tests/classifier-fixtures.json");

function loadFixtures(): ClassifierFixture[] {
  if (!fs.existsSync(FIXTURE_FILE)) {
    throw new Error(`Missing fixture file: ${FIXTURE_FILE}`);
  }

  const raw = JSON.parse(fs.readFileSync(FIXTURE_FILE, "utf-8"));
  if (!Array.isArray(raw)) {
    throw new Error("Classifier fixtures must be a JSON array.");
  }

  return raw as ClassifierFixture[];
}

function saveFixtures(fixtures: ClassifierFixture[]): void {
  fs.writeFileSync(FIXTURE_FILE, JSON.stringify(fixtures, null, 2), "utf-8");
}

function arrayEq(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    const setA = new Set(a.map(String));
    const setB = new Set(b.map(String));
    if (setA.size !== setB.size) return false;
    for (const value of setA) {
      if (!setB.has(value)) return false;
    }
    return true;
  }
  return String(a) === String(b);
}

function getContentQuality(
  title: string,
  textSnippet: string,
): {
  contentQuality:
    | "TITLE_ONLY"
    | "TITLE_HEADINGS"
    | "PARTIAL_BODY"
    | "FULL_BODY"
    | "SUSPICIOUS_BODY";
  bodyCharCount: number;
  suspiciousEvidenceReasons: string[];
  semanticCeiling: number;
} {
  const bodyText = String(textSnippet || "")
    .replace(title, "")
    .replace(/\s+/g, " ")
    .trim();
  const bodyCharCount = bodyText.length;
  const headingCount = (
    String(textSnippet || "").match(/\n[A-Z][^\n]{5,80}\n/g) || []
  ).length;
  const suspiciousEvidenceReasons: string[] = [];

  if (bodyCharCount > 250_000) {
    suspiciousEvidenceReasons.push(
      `bodyCharCount ${bodyCharCount} exceeds 250000`,
    );
  }
  if (headingCount > 2500) {
    suspiciousEvidenceReasons.push(`headingCount ${headingCount} exceeds 2500`);
  }

  const contentQuality =
    suspiciousEvidenceReasons.length > 0
      ? "SUSPICIOUS_BODY"
      : bodyCharCount < 100 && headingCount < 2
        ? "TITLE_ONLY"
        : bodyCharCount < 400
          ? "TITLE_HEADINGS"
          : bodyCharCount < 1000
            ? "PARTIAL_BODY"
            : "FULL_BODY";

  const semanticCeilingMap = {
    TITLE_ONLY: 0.62,
    TITLE_HEADINGS: 0.74,
    PARTIAL_BODY: 0.87,
    FULL_BODY: 0.97,
    SUSPICIOUS_BODY: 0.72,
  } as const;

  return {
    contentQuality,
    bodyCharCount,
    suspiciousEvidenceReasons,
    semanticCeiling: semanticCeilingMap[contentQuality],
  };
}

function getExpectedConfidence(
  fixture: ClassifierFixture,
  field: ExpectedField,
  fallback: number,
): number {
  return fixture.expected[field]?.confidence ?? fallback;
}

function createMockClassification(
  fixture: ClassifierFixture,
): MockClassification {
  return {
    assetType: {
      value: String(fixture.expected.assetType?.value ?? "Document"),
      confidence: getExpectedConfidence(fixture, "assetType", 0.91),
    },
    assetSubType: {
      value: Array.isArray(fixture.expected.assetSubType?.value)
        ? fixture.expected.assetSubType.value
        : fixture.expected.assetSubType?.value
          ? [String(fixture.expected.assetSubType.value)]
          : ["Webpage"],
      confidence: getExpectedConfidence(fixture, "assetSubType", 0.91),
    },
    schemaType: {
      value: String(fixture.expected.schemaType?.value ?? "Article"),
      confidence: getExpectedConfidence(fixture, "schemaType", 0.91),
    },
    product: {
      value: Array.isArray(fixture.expected.product?.value)
        ? fixture.expected.product.value
        : fixture.expected.product?.value
          ? [String(fixture.expected.product.value)]
          : [],
      confidence: getExpectedConfidence(fixture, "product", 0.88),
    },
    jobLevel: {
      value: Array.isArray(fixture.expected.jobLevel?.value)
        ? fixture.expected.jobLevel.value
        : fixture.expected.jobLevel?.value
          ? [String(fixture.expected.jobLevel.value)]
          : [],
      confidence: getExpectedConfidence(fixture, "jobLevel", 0.86),
    },
    jobFunction: {
      value: Array.isArray(fixture.expected.jobFunction?.value)
        ? fixture.expected.jobFunction.value
        : fixture.expected.jobFunction?.value
          ? [String(fixture.expected.jobFunction.value)]
          : [],
      confidence: getExpectedConfidence(fixture, "jobFunction", 0.86),
    },
    audience: {
      value: Array.isArray(fixture.expected.audience?.value)
        ? fixture.expected.audience.value
        : fixture.expected.audience?.value
          ? [String(fixture.expected.audience.value)]
          : [],
      confidence: getExpectedConfidence(fixture, "audience", 0.86),
    },
    topic: {
      value: Array.isArray(fixture.expected.topic?.value)
        ? fixture.expected.topic.value
        : fixture.expected.topic?.value
          ? [String(fixture.expected.topic.value)]
          : [],
      confidence: getExpectedConfidence(fixture, "topic", 0.88),
    },
    useCases: { value: [], confidence: 0.82 },
    funnelStage: {
      value: String(fixture.expected.funnelStage?.value ?? "Awareness (TOFU)"),
      confidence: getExpectedConfidence(fixture, "funnelStage", 0.88),
    },
    industry: {
      value: Array.isArray(fixture.expected.industry?.value)
        ? fixture.expected.industry.value
        : fixture.expected.industry?.value
          ? [String(fixture.expected.industry.value)]
          : [],
      confidence: getExpectedConfidence(fixture, "industry", 0.86),
    },
    companySize: {
      value: Array.isArray(fixture.expected.companySize?.value)
        ? fixture.expected.companySize.value
        : fixture.expected.companySize?.value
          ? [String(fixture.expected.companySize.value)]
          : [],
      confidence: getExpectedConfidence(fixture, "companySize", 0.8),
    },
    region: {
      value: Array.isArray(fixture.expected.region?.value)
        ? fixture.expected.region.value
        : fixture.expected.region?.value
          ? [String(fixture.expected.region.value)]
          : ["Global"],
      confidence: getExpectedConfidence(fixture, "region", 0.9),
    },
    language: {
      value: String(fixture.expected.language?.value ?? "EN"),
      confidence: getExpectedConfidence(fixture, "language", 0.99),
    },
    usageRights: {
      value: String(fixture.expected.usageRights?.value ?? "External"),
      confidence: getExpectedConfidence(fixture, "usageRights", 0.99),
    },
    competitivePositioning: {
      mentionsCompetitors: false,
      competitorNames: [],
      competitorCategories: [],
      positioningType: "none",
    },
    reasoning: "Deterministic replay fixture.",
  };
}

async function runGovernanceBoundaryTests(): Promise<TestResult> {
  const failures: string[] = [];
  const classificationToolPath = path.resolve(
    "api/_shared/tools/classificationTool.ts",
  );
  const runtimePolicyPath = path.resolve(
    "api/_shared/tools/classificationRuntimePolicy.ts",
  );
  const classificationSupportPath = path.resolve(
    "api/_shared/utils/classificationSupport.ts",
  );
  const classifyPillarPagesPath = path.resolve(
    "scripts/classify-pillar-pages.ts",
  );
  const classificationToolSource = fs.readFileSync(
    classificationToolPath,
    "utf-8",
  );
  const runtimePolicySource = fs.readFileSync(runtimePolicyPath, "utf-8");
  const classificationSupportSource = fs.readFileSync(
    classificationSupportPath,
    "utf-8",
  );
  const classifyPillarPagesSource = fs.readFileSync(
    classifyPillarPagesPath,
    "utf-8",
  );

  if (!CLASSIFIER_SEMANTIC_CONFIDENCE_FIELDS.includes("industry")) {
    failures.push(
      `policy.semanticFields: expected "industry" in ${CLASSIFIER_POLICY_VERSION}`,
    );
  }
  if (
    !BATCH_FEW_SHOT_DISABLED_CONTENT_TYPES.includes("pageCaseStudy") ||
    !BATCH_FEW_SHOT_DISABLED_CONTENT_TYPES.includes("caseStudy")
  ) {
    failures.push(
      `classifierPolicy(${CLASSIFIER_POLICY_VERSION}): expected case study content types to disable bulk few-shot retrieval`,
    );
  }
  if (
    BATCH_FACT_CONTENT_LIMITS.pageCaseStudy !== 1200 ||
    BATCH_FACT_CONTENT_LIMITS.caseStudy !== 1200
  ) {
    failures.push(
      `classifierPolicy(${CLASSIFIER_POLICY_VERSION}): expected case-study bulk fact prompt limit to stay at 1200 chars`,
    );
  }
  if (
    !COMPETITIVE_NAMED_COMPETITOR_LABELS.includes("Sitecore") ||
    !COMPETITIVE_CATEGORY_ALTERNATIVE_LABELS.includes("Legacy CMS") ||
    !COMPETITIVE_POSITIONING_TYPE_LABELS.includes("mixed")
  ) {
    failures.push(
      "taxonomyDefinition: expected controlled competitive positioning labels to remain governed",
    );
  }
  if (
    !JOB_FUNCTION_RULES.some(
      (rule) =>
        rule.taxonomyLabel === "Web Development" &&
        (rule.exactTitles || []).includes("web developer"),
    ) ||
    !JOB_FUNCTION_RULES.some(
      (rule) =>
        rule.taxonomyLabel === "IT/Engineering" &&
        (rule.exactTitles || []).includes("director of it"),
    )
  ) {
    failures.push(
      `jobRoleNormalization(${CLASSIFIER_POLICY_VERSION}): expected governed title aliases for Web Development and IT/Engineering`,
    );
  }
  if (
    !JOB_LEVEL_RULES.some(
      (rule) =>
        rule.taxonomyLabel === "C-Level" &&
        (rule.exactTitles || []).includes("chief executive officer"),
    ) ||
    !JOB_LEVEL_RULES.some(
      (rule) =>
        rule.taxonomyLabel === "Director" &&
        (rule.contains || []).includes("director"),
    )
  ) {
    failures.push(
      `jobRoleNormalization(${CLASSIFIER_POLICY_VERSION}): expected governed executive and director level aliases`,
    );
  }

  const pricingProfile = loadContentTypeProfile("pagePricing");
  if (!pricingProfile) {
    failures.push("contentTypeProfiles.pagePricing: profile missing");
  } else {
    if (pricingProfile.schemaType.default !== "SoftwareApplication") {
      failures.push(
        `contentTypeProfiles.pagePricing.schemaType: expected "SoftwareApplication", got "${pricingProfile.schemaType.default}"`,
      );
    }
    if (
      pricingProfile.funnelStage.allowed.length !== 1 ||
      pricingProfile.funnelStage.allowed[0] !== "Evaluation/Engagement (BOFU)"
    ) {
      failures.push(
        `contentTypeProfiles.pagePricing.funnelStage.allowed: expected BOFU-only, got "${pricingProfile.funnelStage.allowed.join(", ")}"`,
      );
    }
  }

  const caseStudyProfile = loadContentTypeProfile("pageCaseStudy");
  if (!caseStudyProfile) {
    failures.push("contentTypeProfiles.pageCaseStudy: profile missing");
  } else {
    if (caseStudyProfile.funnelStage.default !== "Consideration (MOFU)") {
      failures.push(
        `contentTypeProfiles.pageCaseStudy.funnelStage.default: expected "Consideration (MOFU)", got "${caseStudyProfile.funnelStage.default}"`,
      );
    }
    if (
      caseStudyProfile.funnelStage.allowed.length !== 1 ||
      caseStudyProfile.funnelStage.allowed[0] !== "Consideration (MOFU)"
    ) {
      failures.push(
        `contentTypeProfiles.pageCaseStudy.funnelStage.allowed: expected MOFU-only, got "${caseStudyProfile.funnelStage.allowed.join(", ")}"`,
      );
    }
  }

  const sanitizedTitle = sanitizeClassifierTitle("Case Study: Asics [churned]");
  if (sanitizedTitle !== "Case Study: Asics") {
    failures.push(
      `classificationSupport.sanitizeClassifierTitle: expected "Case Study: Asics", got "${sanitizedTitle}"`,
    );
  }

  const coercedIndustry = coerceToAllowed({
    values: ["software it and technology"],
    allowed: ["Software, IT & Technology", "Retail"],
  });
  if (!arrayEq(coercedIndustry, ["Software, IT & Technology"])) {
    failures.push(
      `classificationSupport.coerceToAllowed: expected canonical industry label, got "${coercedIndustry.join(", ")}"`,
    );
  }

  const subjectivePrompt = buildSubjectivePrompt({
    contentQualityBlock: "",
    signalBlock: "",
    companyBlock: "",
    contentBlock: "",
    allowedBlock: "",
    fewShotBlock: "",
    factSummaryBlock: "",
    assetId: "governance-boundary",
    contentType: "page",
  });
  if (/jobLevel depends on funnelStage/i.test(subjectivePrompt)) {
    failures.push(
      `classifierPrompts(${CLASSIFIER_PROMPT_VERSION}): prompt still says jobLevel depends on funnelStage`,
    );
  }
  if (
    !/Resolve funnelStage and jobLevel independently from the same content evidence\./.test(
      subjectivePrompt,
    )
  ) {
    failures.push(
      `classifierPrompts(${CLASSIFIER_PROMPT_VERSION}): prompt missing independent-resolution rule`,
    );
  }
  if (
    /Generic horizontal platform product pages usually target Content \+ IT\/Engineering and skew Director \+ VP/i.test(
      subjectivePrompt,
    )
  ) {
    failures.push(
      `classifierPrompts(${CLASSIFIER_PROMPT_VERSION}): prompt still hard-biases generic platform persona outputs`,
    );
  }
  if (
    !/Keep each reason concise: target 4-12 words, hard max 18 words after the tag\./.test(
      subjectivePrompt,
    )
  ) {
    failures.push(
      `classifierPrompts(${CLASSIFIER_PROMPT_VERSION}): prompt missing concise per-field reasoning rule`,
    );
  }
  if (
    !/Every listed field must appear exactly once, in the order shown below\./.test(
      subjectivePrompt,
    )
  ) {
    failures.push(
      `classifierPrompts(${CLASSIFIER_PROMPT_VERSION}): prompt missing exact per-field coverage rule`,
    );
  }
  if (
    !/Do not emit "FINAL OUTPUT SNAPSHOT" or any final-value dump\./.test(
      subjectivePrompt,
    )
  ) {
    failures.push(
      `classifierPrompts(${CLASSIFIER_PROMPT_VERSION}): prompt missing no-snapshot reasoning rule`,
    );
  }
  if (
    !/competitivePositioning must use the controlled taxonomy below\./.test(
      subjectivePrompt,
    )
  ) {
    failures.push(
      `classifierPrompts(${CLASSIFIER_PROMPT_VERSION}): prompt missing controlled competitive taxonomy rule`,
    );
  }
  if (!/Named competitors are only: /.test(subjectivePrompt)) {
    failures.push(
      `classifierPrompts(${CLASSIFIER_PROMPT_VERSION}): prompt missing named competitor allowlist`,
    );
  }
  if (!/Category alternatives are only: /.test(subjectivePrompt)) {
    failures.push(
      `classifierPrompts(${CLASSIFIER_PROMPT_VERSION}): prompt missing category alternative allowlist`,
    );
  }
  if (
    !/Normalize explicit role evidence onto the governed job-function taxonomy/.test(
      subjectivePrompt,
    )
  ) {
    failures.push(
      `classifierPrompts(${CLASSIFIER_PROMPT_VERSION}): prompt missing governed role-normalization rule`,
    );
  }
  if (
    !/preserve uncertainty rather than forcing a narrower level/.test(
      subjectivePrompt,
    )
  ) {
    failures.push(
      `classifierPrompts(${CLASSIFIER_PROMPT_VERSION}): prompt missing uncertainty-preserving job-level rule`,
    );
  }
  if (
    !/jobFunction is about the primary buyer or evaluator roles the page targets/.test(
      subjectivePrompt,
    )
  ) {
    failures.push(
      `classifierPrompts(${CLASSIFIER_PROMPT_VERSION}): prompt missing buyer-role job-function rule`,
    );
  }
  if (!fs.existsSync(runtimePolicyPath)) {
    failures.push(
      "classificationRuntimePolicy.ts: expected runtime policy module to exist",
    );
  }
  if (
    !/const EDUCATIONAL_TOPIC_JOB_FUNCTION_MAP: Record<string, string> = \{/.test(
      runtimePolicySource,
    )
  ) {
    failures.push(
      "classificationRuntimePolicy.ts: expected centralized educational topic-to-job-function mapping",
    );
  }
  if (
    !/classification\.jobFunction\.value = resolveBroadEducationalJobFunctions\(/.test(
      runtimePolicySource,
    )
  ) {
    failures.push(
      "classificationRuntimePolicy.ts: expected broad educational job-function hardening to flow through the shared helper",
    );
  }
  if (
    !/from "\.\/classificationRuntimePolicy\.js"/.test(classificationToolSource)
  ) {
    failures.push(
      "classificationTool.ts: expected orchestration file to import classificationRuntimePolicy",
    );
  }
  if (
    !/final stored value after human correction/.test(classificationSupportSource)
  ) {
    failures.push(
      "classificationSupport.ts: expected snapshot wording to distinguish human-corrected finals",
    );
  }
  if (
    !/final stored value after post-processing/.test(classificationSupportSource)
  ) {
    failures.push(
      "classificationSupport.ts: expected snapshot wording to distinguish post-processed finals",
    );
  }
  if (/const classificationPrompt = `/.test(classificationToolSource)) {
    failures.push(
      "classificationTool.ts: dead inline classificationPrompt block should not exist in orchestration runtime",
    );
  }
  if (
    !/const IS_CASE_STUDY_BATCH = \["pageCaseStudy", "caseStudy"\]\.includes\(\s*CONTENT_TYPE,\s*\)/m.test(
      classifyPillarPagesSource,
    )
  ) {
    failures.push(
      "classify-pillar-pages.ts: expected explicit case-study batch detection",
    );
  }
  if (
    !/skipCache: FORCE_RECLASSIFY \|\| IS_CASE_STUDY_BATCH/.test(
      classifyPillarPagesSource,
    )
  ) {
    failures.push(
      `classifierPolicy(${CLASSIFIER_POLICY_VERSION}): expected case-study batch exports to bypass cache`,
    );
  }
  if (
    !/stripSnapshot\(result\.reasoning \|\| ""\)/.test(
      classifyPillarPagesSource,
    )
  ) {
    failures.push(
      `classifierPolicy(${CLASSIFIER_POLICY_VERSION}): expected case-study batch exports to strip FINAL OUTPUT SNAPSHOT from reasoning`,
    );
  }
  if (
    !/classification\.product\.value = normalizeCaseStudyProducts\(/.test(
      classificationToolSource + runtimePolicySource,
    )
  ) {
    failures.push(
      `classifierPolicy(${CLASSIFIER_POLICY_VERSION}): expected case-study runtime to normalize product selection from explicit page evidence`,
    );
  }

  return {
    id: "governance-boundary",
    passed: failures.length === 0,
    failures,
  };
}

async function runSignalTests(fixture: ClassifierFixture): Promise<string[]> {
  if (!fixture.expectedSignals) return [];

  const failures: string[] = [];
  const sig = fixture.expectedSignals;
  const got = extractContentSignals(
    fixture.input.slug,
    fixture.input.title,
    fixture.input.textSnippet,
  );

  if (sig.urlPattern !== undefined && got.urlPattern !== sig.urlPattern) {
    failures.push(
      `signal.urlPattern: expected "${sig.urlPattern}", got "${got.urlPattern}"`,
    );
  }
  if (
    sig.isProductPage !== undefined &&
    got.isProductPage !== sig.isProductPage
  ) {
    failures.push(
      `signal.isProductPage: expected ${sig.isProductPage}, got ${got.isProductPage}`,
    );
  }
  if (sig.hasDemo !== undefined && got.hasDemo !== sig.hasDemo) {
    failures.push(
      `signal.hasDemo: expected ${sig.hasDemo}, got ${got.hasDemo}`,
    );
  }
  if (sig.hasPricing !== undefined && got.hasPricing !== sig.hasPricing) {
    failures.push(
      `signal.hasPricing: expected ${sig.hasPricing}, got ${got.hasPricing}`,
    );
  }
  if (sig.hasVideo !== undefined && got.hasVideo !== sig.hasVideo) {
    failures.push(
      `signal.hasVideo: expected ${sig.hasVideo}, got ${got.hasVideo}`,
    );
  }
  if (sig.hasDownload !== undefined && got.hasDownload !== sig.hasDownload) {
    failures.push(
      `signal.hasDownload: expected ${sig.hasDownload}, got ${got.hasDownload}`,
    );
  }
  if (
    sig.hasStepByStep !== undefined &&
    got.hasStepByStep !== sig.hasStepByStep
  ) {
    failures.push(
      `signal.hasStepByStep: expected ${sig.hasStepByStep}, got ${got.hasStepByStep}`,
    );
  }
  if (
    sig.detectedLanguage !== undefined &&
    got.detectedLanguage !== sig.detectedLanguage
  ) {
    failures.push(
      `signal.detectedLanguage: expected "${sig.detectedLanguage}", got "${got.detectedLanguage}"`,
    );
  }
  if (
    sig.overrideSchemaType !== undefined &&
    got.override.schemaType !== sig.overrideSchemaType
  ) {
    failures.push(
      `signal.override.schemaType: expected "${sig.overrideSchemaType}", got "${got.override.schemaType}"`,
    );
  }
  if (
    sig.overrideFunnelStage !== undefined &&
    got.override.funnelStage !== sig.overrideFunnelStage
  ) {
    failures.push(
      `signal.override.funnelStage: expected "${sig.overrideFunnelStage}", got "${got.override.funnelStage}"`,
    );
  }
  if (
    sig.topicHints !== undefined &&
    !arrayEq(got.topicHints, sig.topicHints)
  ) {
    failures.push(
      `signal.topicHints: expected "${sig.topicHints.join(", ")}", got "${got.topicHints.join(", ")}"`,
    );
  }

  return failures;
}

async function runDeterministicReplay(
  fixture: ClassifierFixture,
): Promise<string[]> {
  const failures: string[] = [];
  const signals = extractContentSignals(
    fixture.input.slug,
    fixture.input.title,
    fixture.input.textSnippet,
  );
  const profile = loadContentTypeProfile(fixture.input.contentType);
  const assetTitle =
    sanitizeClassifierTitle(fixture.input.title) || fixture.input.title;
  const {
    contentQuality,
    bodyCharCount,
    suspiciousEvidenceReasons,
    semanticCeiling,
  } = getContentQuality(assetTitle, fixture.input.textSnippet);
  const classification = createMockClassification(fixture);

  const { consistencyWarnings, openQuestionFlags } =
    applyDeterministicRuntimePolicies({
      classification: classification as unknown as ClassificationResult,
      asset: {
        id: fixture.input.entryId,
        title: fixture.input.title,
        contentType: fixture.input.contentType,
        textContent: fixture.input.textSnippet,
        slug: fixture.input.slug,
      },
      assetTitle,
      signals,
      profile,
      contentQuality,
      semanticCeiling,
      bodyCharCount,
      suspiciousEvidenceReasons,
    });

  finalizeClassificationReviewState({
    classification: classification as unknown as ClassificationResult,
    assetId: fixture.input.entryId,
    contentQuality,
    suspiciousEvidenceReasons,
    consistencyWarnings,
    openQuestionFlags,
  });

  for (const [field, expectation] of Object.entries(fixture.expected) as Array<
    [ExpectedField, FieldExpectation]
  >) {
    const actual = (
      classification as unknown as Record<
        string,
        { value: unknown; confidence: number }
      >
    )[field];
    if (!actual) {
      failures.push(`replay.${field}: missing field in deterministic result`);
      continue;
    }
    if (!arrayEq(actual.value, expectation.value)) {
      failures.push(
        `replay.${field}: expected "${Array.isArray(expectation.value) ? expectation.value.join(", ") : expectation.value}", got "${Array.isArray(actual.value) ? actual.value.join(", ") : String(actual.value)}"`,
      );
    }
    if (
      typeof expectation.confidence === "number" &&
      Number(actual.confidence) + 1e-9 < expectation.confidence
    ) {
      failures.push(
        `replay.${field}.confidence: expected >= ${expectation.confidence}, got ${actual.confidence}`,
      );
    }
  }

  if (!Number.isFinite(classification.overallConfidence)) {
    failures.push(
      "replay.overallConfidence: expected finite overall confidence",
    );
  }
  if (typeof classification.needsReview !== "boolean") {
    failures.push("replay.needsReview: expected boolean review decision");
  }
  const classificationExtra = classification as typeof classification & { reviewReasons?: string[]; confidenceCalibration?: Record<string, number> };
  if (
    !Array.isArray(classificationExtra.reviewReasons) ||
    classificationExtra.reviewReasons.length === 0
  ) {
    failures.push(
      "replay.reviewReasons: expected populated review reasons array",
    );
  }
  if (!classificationExtra.confidenceCalibration) {
    failures.push(
      "replay.confidenceCalibration: expected calibration metadata after replay",
    );
  }

  return failures;
}

async function runFixture(fixture: ClassifierFixture): Promise<TestResult> {
  const failures: string[] = [];
  failures.push(...(await runSignalTests(fixture)));
  failures.push(...(await runDeterministicReplay(fixture)));
  return { id: fixture.id, passed: failures.length === 0, failures };
}

function buildCoverageSummary(fixtures: ClassifierFixture[]) {
  const fieldCoverage = new Map<ExpectedField, number>();
  let signalFixtures = 0;
  let recordedFixtures = 0;

  for (const fixture of fixtures) {
    if (fixture.expectedSignals) signalFixtures++;
    if (fixture.recordedAt) recordedFixtures++;
    for (const field of Object.keys(fixture.expected) as ExpectedField[]) {
      fieldCoverage.set(field, (fieldCoverage.get(field) || 0) + 1);
    }
  }

  return {
    fixtureCount: fixtures.length,
    recordedFixtures,
    signalFixtures,
    expectedFieldCoverage: Object.fromEntries(
      Array.from(fieldCoverage.entries()).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const recordMode = args.includes("--record");
  const updateId = args[args.indexOf("--update") + 1] ?? null;

  console.log("🧪 Content Classifier Test Suite\n");

  const fixtures = loadFixtures();
  if (fixtures.length === 0) {
    throw new Error(
      `Classifier fixture dataset is empty. Add committed fixtures to ${FIXTURE_FILE}.`,
    );
  }

  if (recordMode) {
    console.log(
      "📹 Record mode: calling Gemini to refresh committed baselines...\n",
    );
    const { classifyContent } = await import(
      "../api/_shared/tools/classificationTool.js"
    );
    const toRecord = updateId
      ? fixtures.filter((fixture) => fixture.id === updateId)
      : fixtures;

    for (const fixture of toRecord) {
      process.stdout.write(`  Recording ${fixture.id} ... `);
      try {
        const result = await classifyContent({
          asset: {
            id: fixture.input.entryId,
            title: fixture.input.title,
            contentType: fixture.input.contentType,
            textContent: fixture.input.textSnippet,
            slug: fixture.input.slug,
          },
        });
        fixture.expected = {
          assetType: {
            value: result.assetType.value,
            confidence: result.assetType.confidence,
          },
          assetSubType: {
            value: result.assetSubType.value,
            confidence: result.assetSubType.confidence,
          },
          schemaType: {
            value: result.schemaType.value,
            confidence: result.schemaType.confidence,
          },
          funnelStage: {
            value: result.funnelStage.value,
            confidence: result.funnelStage.confidence,
          },
          product: {
            value: result.product.value,
            confidence: result.product.confidence,
          },
          topic: {
            value: result.topic.value,
            confidence: result.topic.confidence,
          },
          industry: {
            value: result.industry.value,
            confidence: result.industry.confidence,
          },
          audience: {
            value: result.audience.value,
            confidence: result.audience.confidence,
          },
          jobLevel: {
            value: result.jobLevel.value,
            confidence: result.jobLevel.confidence,
          },
          jobFunction: {
            value: result.jobFunction.value,
            confidence: result.jobFunction.confidence,
          },
          language: {
            value: result.language.value,
            confidence: result.language.confidence,
          },
          usageRights: {
            value: result.usageRights.value,
            confidence: result.usageRights.confidence,
          },
          region: {
            value: result.region.value,
            confidence: result.region.confidence,
          },
          companySize: {
            value: result.companySize.value,
            confidence: result.companySize.confidence,
          },
        };
        fixture.recordedAt = new Date().toISOString();
        console.log(
          `✓ (${Math.round((result.overallConfidence ?? 0) * 100)}% confidence)`,
        );
      } catch (error) {
        console.log(
          `✗ FAILED: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    saveFixtures(fixtures);
    console.log(
      `\n✅ Recorded ${toRecord.length} fixture(s) to ${FIXTURE_FILE}`,
    );
    return;
  }

  console.log(
    `Running ${fixtures.length + 1} deterministic checks (signal + replay + governance, no Gemini)\n`,
  );

  let passed = 0;
  let failed = 0;
  const failedFixtures: TestResult[] = [];

  const governanceResult = await runGovernanceBoundaryTests();
  if (governanceResult.passed) {
    console.log(
      `  ✓ ${governanceResult.id} — governed support modules stay aligned with classifier policy`,
    );
    passed++;
  } else {
    console.log(
      `  ✗ ${governanceResult.id} — governed support modules stay aligned with classifier policy`,
    );
    for (const failure of governanceResult.failures) {
      console.log(`      → ${failure}`);
    }
    failedFixtures.push(governanceResult);
    failed++;
  }

  for (const fixture of fixtures) {
    const result = await runFixture(fixture);
    if (result.passed) {
      console.log(`  ✓ ${fixture.id} — ${fixture.description}`);
      passed++;
    } else {
      console.log(`  ✗ ${fixture.id} — ${fixture.description}`);
      for (const failure of result.failures) {
        console.log(`      → ${failure}`);
      }
      failedFixtures.push(result);
      failed++;
    }
  }

  const coverage = buildCoverageSummary(fixtures);
  console.log("\nFixture coverage:", JSON.stringify(coverage, null, 2));
  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log(
      "\n❌ Deterministic classifier replay failed. Fix the regression before changing prompts or runtime policies.",
    );
    process.exit(1);
  }

  console.log(
    "\n✅ Deterministic replay passed. The committed fixture set still matches signal extraction and post-processing behavior.",
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
