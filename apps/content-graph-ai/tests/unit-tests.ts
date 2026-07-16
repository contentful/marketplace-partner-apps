/**
 * Lightweight unit tests — no external services, no test framework needed.
 * Run: npx tsx tests/unit-tests.ts
 */
import assert from "node:assert";
import {
  sanitizeClassifierTitle,
  CLASSIFIER_EXECUTION_PROFILES,
} from "../api/_shared/config/classifierPolicy.js";
import {
  appendFinalReasoningSnapshot,
  coerceSingleAllowed,
} from "../api/_shared/utils/classificationSupport.js";
import {
  canonicalizeCompanyMentions,
  extractContentSignals,
} from "../api/_shared/utils/contentSignals.js";
import {
  computeConfidenceSummary,
  normalizeConfidence,
} from "../api/_shared/utils/confidenceCalibration.js";
import {
  checkBudget,
  getUsageSummary,
  trackUsage,
} from "../api/_shared/utils/costTracker.js";
import {
  applyFeedbackOverrides,
  selectFewShotExamples,
} from "../api/_shared/utils/feedbackStore.js";
import { sanitizeToken } from "../api/_shared/utils/sanitizeToken.js";
import {
  computeOpenQuestionFlags,
  isHeadlessCmsPlatformContext,
  isGenericPlatformProductPage,
  isWebinarLikeContent,
  normalizeAudienceSelection,
  normalizeCompetitivePositioning,
  normalizeIndustrySelection,
  normalizeJobFunctionSelection,
  normalizeJobLevelSelection,
  normalizeSeasonValue,
  shouldKeepSeasonTag,
  shouldPrioritizeHumanReview,
} from "../api/_shared/tools/classificationTool.js";
import {
  applyDeterministicRuntimePolicies,
  inferCaseStudyAudienceJobFunctions,
} from "../api/_shared/tools/classificationRuntimePolicy.js";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${e instanceof Error ? e.message : String(e)}`);
  }
}

console.log("\n=== sanitizeClassifierTitle ===");

test("removes [churned] annotations", () => {
  assert.strictEqual(
    sanitizeClassifierTitle("Case Study: Asics [churned]"),
    "Case Study: Asics",
  );
});

test("removes (deprecated) annotations", () => {
  assert.strictEqual(
    sanitizeClassifierTitle("Old Page (deprecated)"),
    "Old Page",
  );
});

test("removes (replaced with translated version)", () => {
  assert.strictEqual(
    sanitizeClassifierTitle("Page (replaced with translated version)"),
    "Page",
  );
});

test("returns empty string for undefined", () => {
  assert.strictEqual(sanitizeClassifierTitle(undefined), "");
});

test("preserves normal titles", () => {
  assert.strictEqual(
    sanitizeClassifierTitle("Contentful Platform"),
    "Contentful Platform",
  );
});

console.log("\n=== normalizeConfidence ===");

test("normalizes 0-1 range", () => {
  assert.strictEqual(normalizeConfidence(0.85), 0.85);
});

test("normalizes 0-100 range to 0-1", () => {
  assert.strictEqual(normalizeConfidence(85), 0.85);
});

test("clamps to 0 for negative", () => {
  assert.strictEqual(normalizeConfidence(-0.5), 0);
});

test("clamps to 1 for > 100", () => {
  assert.strictEqual(normalizeConfidence(150), 1);
});

test("returns 0 for undefined", () => {
  assert.strictEqual(normalizeConfidence(undefined), 0);
});

test("returns 0 for NaN", () => {
  assert.strictEqual(normalizeConfidence(NaN), 0);
});

test("coerces compact spacing aliases onto allowed taxonomy labels", () => {
  assert.strictEqual(
    coerceSingleAllowed({
      value: "Web page",
      allowed: ["Webpage", "Blog"],
    }),
    "Webpage",
  );
});

test("labels human-overridden snapshot fields as human-corrected finals", () => {
  const reasoning = appendFinalReasoningSnapshot(
    "jobFunction: [AI] buyer roles targeted in hero copy",
    {
      jobFunction: { value: ["Content", "IT/Engineering"] },
      audience: { value: ["Prospect"] },
    },
    ["jobFunction"],
  );

  assert.match(
    reasoning,
    /jobFunction: \[FINAL; HUMAN\] Content, IT\/Engineering — final stored value after human correction/,
  );
  assert.match(
    reasoning,
    /audience: \[FINAL\] Prospect — final stored value after post-processing/,
  );
});

test("reports field-level calibration gaps including industry", () => {
  const summary = computeConfidenceSummary({
    topic: { value: ["Headless CMS"], confidence: 0.97 },
    jobLevel: { value: ["Director"], confidence: 0.97 },
    jobFunction: { value: ["Content"], confidence: 0.97 },
    useCases: { value: ["Digital experiences"], confidence: 0.97 },
    funnelStage: { value: "Evaluation/Engagement (BOFU)", confidence: 0.97 },
    industry: { value: ["Software, IT & Technology"], confidence: 0.97 },
    assetType: { value: "Webpage", confidence: 0.99 },
    assetSubType: { value: ["Product"], confidence: 0.99 },
    product: { value: ["Platform"], confidence: 0.99 },
    audience: { value: [], confidence: 0.97 },
    companySize: {
      value: ["Commercial ($10M - $500M revenue)"],
      confidence: 0.85,
    },
    region: { value: ["Global"], confidence: 0.99 },
    language: { value: "EN", confidence: 0.99 },
    usageRights: { value: "External", confidence: 0.99 },
  });
  assert.ok(
    summary.reviewReasons.some((reason) =>
      reason.includes("Semantic calibration gaps"),
    ),
  );
  assert.ok(
    summary.calibrationMetadata.uncalibratedSemanticFields?.includes("topic"),
  );
  assert.ok(
    summary.calibrationMetadata.semanticFieldCoverage?.some(
      (item) => item.field === "industry",
    ),
  );
});

console.log("\n=== sanitizeToken ===");

test("trims whitespace", () => {
  assert.strictEqual(sanitizeToken("  abc  "), "abc");
});

test("removes wrapping double quotes", () => {
  assert.strictEqual(sanitizeToken('"mytoken"'), "mytoken");
});

test("removes wrapping single quotes", () => {
  assert.strictEqual(sanitizeToken("'mytoken'"), "mytoken");
});

test("returns empty string for undefined", () => {
  assert.strictEqual(sanitizeToken(undefined), "");
});

console.log("\n=== CLASSIFIER_EXECUTION_PROFILES ===");

test("default profile enables all features", () => {
  const profile = CLASSIFIER_EXECUTION_PROFILES.default;
  assert.strictEqual(profile.useExternalNlp, true);
  assert.strictEqual(profile.companyLookupMode, "full");
  assert.strictEqual(profile.useDynamicFewShot, true);
});

test("interactive profile is limited", () => {
  const profile = CLASSIFIER_EXECUTION_PROFILES.interactive;
  assert.strictEqual(profile.useExternalNlp, false);
  assert.strictEqual(profile.companyLookupMode, "cache-only");
  assert.strictEqual(profile.useDynamicFewShot, false);
});

test("zero-dollar monthly budget blocks spend", () => {
  const originalBudget = process.env.LLM_MONTHLY_BUDGET_USD;
  process.env.LLM_MONTHLY_BUDGET_USD = "0";
  try {
    trackUsage("gpt-4o", { inputTokens: 1, outputTokens: 1 }, 0.0001);
    assert.strictEqual(checkBudget(), false);
    assert.strictEqual(getUsageSummary().budgetUsd, 0);
  } finally {
    process.env.LLM_MONTHLY_BUDGET_USD = originalBudget;
  }
});

console.log("\n=== contentSignals ===");

test("canonicalizes company mentions and drops ambiguous lowercase matches", () => {
  assert.deepStrictEqual(
    canonicalizeCompanyMentions([
      "target",
      "Target",
      "segment",
      "Segment",
      "DocuSign",
      "docusign",
      "Contentful",
    ]),
    ["Target", "Segment", "DocuSign"],
  );
});

test("prefers English for an English product page with noisy foreign tail text", () => {
  const signals = extractContentSignals(
    "/products/platform",
    "Contentful Platform",
    [
      "Contentful Platform",
      "Get started with Contentful's composable content platform.",
      "Contact sales and view pricing today.",
      "Build digital experiences across every channel.",
      "le la les de du des un une et est dans pour sur avec",
    ].join("\n"),
  );
  assert.strictEqual(signals.detectedLanguage, "EN");
});

test("does not force Prospect audience hints for generic public product pages", () => {
  const signals = extractContentSignals(
    "/products/platform",
    "Contentful Platform",
    "Power your brand with Contentful's digital experience platform.",
  );
  assert.deepStrictEqual(signals.audienceHints, []);
});

test("keeps audience empty for broad product pages without explicit audience evidence", () => {
  assert.deepStrictEqual(
    normalizeAudienceSelection({
      audience: ["Prospect"],
      title: "Contentful Platform",
      slug: "/products/platform",
      textContent:
        "Power your brand with Contentful's digital experience platform. Contact sales to learn more.",
      urlPattern: "product",
      audienceHints: [],
    }),
    [],
  );
});

test("preserves explicit customer and partner audience evidence", () => {
  assert.deepStrictEqual(
    normalizeAudienceSelection({
      audience: [],
      title: "Getting started",
      slug: "/docs/getting-started",
      textContent:
        "Documentation for existing customers and implementation teams.",
      urlPattern: "docs",
      audienceHints: ["Direct Customer"],
    }),
    ["Direct Customer"],
  );

  assert.deepStrictEqual(
    normalizeAudienceSelection({
      audience: [],
      title: "Solution partner program",
      slug: "/partners/solution-partners",
      textContent:
        "Agency partners and system integrators can join the solution partner program.",
      urlPattern: "partner",
      audienceHints: ["Solution / Agency Partner"],
    }),
    ["Solution / Agency Partner"],
  );
});

test("suppresses logo-driven industry on generic platform pages", () => {
  assert.deepStrictEqual(
    normalizeIndustrySelection({
      industry: ["Retail & ecommerce", "Software, IT & Technology"],
      title: "Contentful Platform",
      slug: "/products/platform",
      textContent:
        "Composable content platform for teams building digital experiences across channels.",
      urlPattern: "product",
      contentType: "page",
      funnelStage: "Evaluation/Engagement (BOFU)",
      industryHints: [],
      productValues: ["Platform"],
    }),
    ["Software, IT & Technology"],
  );
});

test("prefers explicit solution-page industry hints over weak model guesses", () => {
  assert.deepStrictEqual(
    normalizeIndustrySelection({
      industry: ["Software, IT & Technology"],
      title: "Retail solutions",
      slug: "/solutions/retail",
      textContent:
        "Contentful helps retailers power modern commerce experiences.",
      urlPattern: "solution",
      contentType: "page",
      funnelStage: "Evaluation/Engagement (BOFU)",
      industryHints: ["Retail & ecommerce"],
      productValues: [],
    }),
    ["Retail & ecommerce"],
  );
});

test("maps explicit engineering/web roles into normalized job-function taxonomy", () => {
  assert.deepStrictEqual(
    normalizeJobFunctionSelection({
      jobFunctions: ["Marketing", "Product"],
      contentType: "page",
      title: "Senior web platform engineering guide",
      slug: "/resources/web-platform-guide",
      structuredHeadings: ["Frontend architecture", "Web application delivery"],
      textContent:
        "Engineering teams and web developers can use this frontend platform guide.",
      productValues: [],
    }),
    ["Engineering", "Web Development"],
  );
});

test("drops weak case-study role guesses when no explicit role evidence exists", () => {
  assert.deepStrictEqual(
    normalizeJobFunctionSelection({
      jobFunctions: ["Sales", "Marketing"],
      contentType: "pageCaseStudy",
      title: "Case Study Page: Ruggable",
      slug: "/case-studies/ruggable",
      structuredHeadings: ["Customer stories", "Results"],
      textContent:
        "Ruggable improved site performance and digital experiences with Contentful.",
      productValues: ["Platform"],
    }),
    [],
  );
});

test("uses scoped full-content title evidence for role normalization helpers", () => {
  assert.deepStrictEqual(
    normalizeJobFunctionSelection({
      jobFunctions: ["Marketing"],
      contentType: "pageCaseStudy",
      title: "Case Study Page: ExampleCo",
      slug: "/case-studies/exampleco",
      structuredHeadings: ["Customer stories", "Results"],
      textContent:
        "“Jane Smith, VP of ecommerce at ExampleCo, said the team shipped faster with Contentful.”",
      productValues: ["Platform"],
    }),
    ["Retail / ecommerce"],
  );

  assert.deepStrictEqual(
    normalizeJobLevelSelection({
      jobLevels: ["Manager"],
      contentType: "pageCaseStudy",
      title: "Case Study Page: ExampleCo",
      slug: "/case-studies/exampleco",
      structuredHeadings: ["Customer stories", "Results"],
      textContent:
        "“Jane Smith, VP of ecommerce at ExampleCo, said the team shipped faster with Contentful.”",
      productValues: ["Platform"],
    }),
    ["VP"],
  );
});

test("case-study audience helper ignores speaker titles without audience phrasing", () => {
  assert.deepStrictEqual(
    inferCaseStudyAudienceJobFunctions(
      "Jane Smith, VP of ecommerce at ExampleCo, said the team shipped faster with Contentful.",
    ),
    [],
  );

  assert.deepStrictEqual(
    inferCaseStudyAudienceJobFunctions(
      "Contentful helps ecommerce teams launch personalized storefronts faster.",
    ),
    ["Retail / ecommerce"],
  );
});

test("preserves model-selected C-Level when not explicitly contradicted", () => {
  assert.deepStrictEqual(
    normalizeJobLevelSelection({
      jobLevels: ["Director", "VP", "C-Level"],
      title: "Contentful Platform",
      slug: "/products/platform",
      structuredHeadings: ["Composable content platform"],
      textContent:
        "Power your brand with Contentful's digital experience platform.",
      productValues: ["Platform"],
    }),
    ["Director", "VP", "C-Level"],
  );
});

test("keeps explicit audience hints for docs and careers pages", () => {
  const docsSignals = extractContentSignals(
    "/docs/getting-started",
    "Getting started",
    "Read the docs and follow the implementation steps.",
  );
  assert.deepStrictEqual(docsSignals.audienceHints, ["Direct Customer"]);

  const careerSignals = extractContentSignals(
    "/careers/senior-product-designer",
    "Senior Product Designer",
    "Join Contentful and apply for this role.",
  );
  assert.deepStrictEqual(careerSignals.audienceHints, ["Internal"]);
});

test("caps structured body summary to keep prompt payload compact", () => {
  const signals = extractContentSignals(
    "/products/platform",
    "Contentful Platform",
    "Composable content platform. ".repeat(400),
  );
  assert.ok(signals.structuredContent.bodySummary.length <= 4000);
});

test("detects the generic horizontal platform product page", () => {
  assert.strictEqual(
    isGenericPlatformProductPage({
      title: "Contentful Platform",
      slug: "/products/platform",
      productValues: ["Platform"],
    }),
    true,
  );
  assert.strictEqual(
    isGenericPlatformProductPage({
      title: "Contentful Personalization",
      slug: "/products/personalization",
      productValues: ["Ninetailed (Personalization)"],
    }),
    false,
  );
  assert.strictEqual(
    isGenericPlatformProductPage({
      title: "Contentful AI Actions",
      slug: "/products/ai-actions",
      productValues: ["AI"],
    }),
    false,
  );
});

test("detects headless CMS platform context from platform-page semantics", () => {
  assert.strictEqual(
    isHeadlessCmsPlatformContext({
      title: "Contentful Platform",
      slug: "/products/platform",
      structuredHeadings: [
        "Composable content platform",
        "Build powerful content models",
      ],
      textContent:
        "Model content once and deliver everywhere through APIs and any frontend.",
    }),
    true,
  );
  assert.strictEqual(
    isHeadlessCmsPlatformContext({
      title: "Contentful Personalization",
      slug: "/products/personalization",
      structuredHeadings: ["Audience targeting", "Experiment variants"],
      textContent: "Personalize content for segments and A/B tests.",
    }),
    false,
  );
});

test("does not count matching human corrections as actual overrides", () => {
  const classification = {
    jobFunction: { value: ["Content", "IT/Engineering"], confidence: 0.91 },
    jobLevel: { value: ["VP", "Director"], confidence: 0.91 },
    topic: { value: ["Headless CMS"], confidence: 0.91 },
    industry: { value: ["Software, IT & Technology"], confidence: 0.91 },
    funnelStage: {
      value: "Evaluation/Engagement (BOFU)",
      confidence: 0.91,
    },
  };
  const overridden = applyFeedbackOverrides(
    "hclvhMBxnJbxq8OQQv7HN",
    classification,
  );
  assert.deepStrictEqual(overridden, []);
  assert.strictEqual(classification.jobFunction.confidence, 0.99);
});

test("normalizes competitive positioning to the controlled taxonomy", () => {
  const competitive = normalizeCompetitivePositioning({
    competitivePositioning: {
      mentionsCompetitors: true,
      competitorNames: ["DocuSign", "Sitecore", "legacy CMS"],
      positioningType: "mixed",
    },
    title: "Move from legacy CMS to a composable platform",
    slug: "/products/platform",
    textContent:
      "Teams migrate from legacy CMS and compare Contentful with Sitecore when modernizing.",
  });

  assert.deepStrictEqual(competitive, {
    mentionsCompetitors: true,
    competitorNames: ["Sitecore"],
    competitorCategories: ["Legacy CMS"],
    positioningType: "mixed",
  });
});

test("drops customer proof brands from competitive positioning", () => {
  const competitive = normalizeCompetitivePositioning({
    competitivePositioning: {
      mentionsCompetitors: true,
      competitorNames: ["DocuSign", "Kraft Heinz", "Mailchimp"],
      positioningType: "named-competitor",
    },
    title: "Customer stories",
    slug: "/customers",
    textContent:
      "DocuSign, Kraft Heinz, and Mailchimp use Contentful to power digital experiences.",
  });

  assert.deepStrictEqual(competitive, {
    mentionsCompetitors: false,
    competitorNames: [],
    competitorCategories: [],
    positioningType: "none",
  });
});

test("keeps named competitors only when they are in the controlled list", () => {
  const competitive = normalizeCompetitivePositioning({
    competitivePositioning: {
      mentionsCompetitors: true,
      competitorNames: ["Optimizely", "Smartling", "Adobe Target"],
      positioningType: "named-competitor",
    },
    title: "Experimentation alternatives",
    slug: "/products/personalization/experimentation",
    textContent:
      "Teams evaluating experimentation tooling often compare Contentful against Optimizely and Adobe Target.",
  });

  assert.deepStrictEqual(competitive, {
    mentionsCompetitors: true,
    competitorNames: ["Optimizely", "Adobe Target"],
    competitorCategories: [],
    positioningType: "named-competitor",
  });
});

console.log("\n=== classifier policy helpers ===");

test("normalizes a noisy season string back to a clean season token", () => {
  assert.strictEqual(
    normalizeSeasonValue(
      "Fall\nWait, the signal says 'Fall'. Let me correct that to 'Fall'.",
    ),
    "Fall",
  );
});

test("drops season when multiple seasons appear in the same value", () => {
  assert.strictEqual(normalizeSeasonValue("Spring and Fall"), null);
});

test("detects webinar pages from common webinar phrasing", () => {
  assert.strictEqual(
    isWebinarLikeContent({
      title: "Personalization webinar recap",
      slug: "/webinars/personalization-recap",
      textContent: "Watch the webinar recording on demand.",
    }),
    true,
  );
});

test("does not treat a product page as webinar from a buried webinar mention", () => {
  assert.strictEqual(
    isWebinarLikeContent({
      title: "Contentful Platform",
      slug: "/products/platform",
      textContent: `${"Platform overview. ".repeat(200)}Watch our 30-minute webinar for more.`,
      structuredHeadings: [
        "Contentful Platform",
        "Composable marketing stack",
        "AI-powered workflows",
      ],
    }),
    false,
  );
});

test("keeps season only for event-like or campaign-like content", () => {
  assert.strictEqual(
    shouldKeepSeasonTag({
      contentType: "page",
      assetSubTypes: ["Webpage"],
      title: "Black Friday campaign guide",
      slug: "/campaigns/black-friday",
      textContent: "A holiday campaign planning page.",
    }),
    true,
  );
  assert.strictEqual(
    shouldKeepSeasonTag({
      contentType: "page",
      assetSubTypes: ["Webpage"],
      title: "Composable content basics",
      slug: "/guides/composable-content",
      textContent: "An evergreen educational page.",
    }),
    false,
  );
  assert.strictEqual(
    shouldKeepSeasonTag({
      contentType: "page",
      assetSubTypes: ["Product"],
      urlPattern: "product",
      title: "Platform (June & Fall Launch 2025 Updates)",
      slug: "/products/platform",
      textContent: "A product overview page updated during a launch cycle.",
    }),
    false,
  );
  assert.strictEqual(
    shouldKeepSeasonTag({
      contentType: "page",
      assetSubTypes: ["Webpage"],
      urlPattern: "product",
      title: "Platform (Fall Launch 2025 Updates)",
      slug: "/products/platform",
      textContent: "A product overview page updated during a launch cycle.",
    }),
    false,
  );
});

test("prioritizes human review for lead-gen asset subtypes", () => {
  assert.strictEqual(shouldPrioritizeHumanReview(["Webinar"]), true);
  assert.strictEqual(shouldPrioritizeHumanReview(["Case Study"]), true);
  assert.strictEqual(shouldPrioritizeHumanReview(["Webpage"]), false);
});

test("does not flag generic page entries with product url patterns as open questions", () => {
  assert.deepStrictEqual(
    computeOpenQuestionFlags({
      contentType: "page",
      urlPattern: "product",
    }),
    [],
  );
});

test("still flags true content type vs url conflicts", () => {
  assert.deepStrictEqual(
    computeOpenQuestionFlags({
      contentType: "pageLongFormSeo",
      urlPattern: "product",
    }),
    [12],
  );
  assert.deepStrictEqual(
    computeOpenQuestionFlags({
      contentType: "pageBlogPost",
      urlPattern: "resource",
    }),
    [12],
  );
});

test("generic platform pages should not keep experimentation as a final use case from body-only mentions", () => {
  const strongSignal = new RegExp(
    "\\b(experimentation|experiment|a/b test|ab test|multivariate)\\b",
    "i",
  );
  assert.strictEqual(
    strongSignal.test("Contentful Platform\n/products/platform"),
    false,
  );
  assert.strictEqual(
    strongSignal.test(
      [
        "Contentful Platform",
        "Composable marketing stack",
        "Made to move at lightspeed",
      ].join("\n"),
    ),
    false,
  );
});

// ---------------------------------------------------------------------------
// feedbackStore — few-shot confirmation gate (v40 P0 fix regression tests)
// ---------------------------------------------------------------------------

const makeCorrection = (
  id: string,
  confirmationCount: number,
  confirmedAt?: string,
) => ({
  entryId: id,
  title: `Test entry ${id}`,
  url: `/test/${id}`,
  correctedAt: "2026-03-31T00:00:00Z",
  fields: { funnelStage: "Awareness (TOFU)" },
  confirmationCount,
  confirmedAt,
});

test("few-shot gate: empty confirmed set returns [] — does not fall back to unconfirmed", () => {
  const store = {
    "entry-001": makeCorrection("entry-001", 1),
    "entry-002": makeCorrection("entry-002", 0),
  };
  const examples = selectFewShotExamples(store as any);
  assert.strictEqual(
    examples.length,
    0,
    "expected [] when no corrections meet confirmationCount >= 2",
  );
});

test("few-shot gate: only confirmed corrections enter few-shot pool", () => {
  const store = {
    "entry-confirmed": makeCorrection(
      "entry-confirmed",
      2,
      "2026-03-31T00:00:00Z",
    ),
    "entry-unconfirmed": makeCorrection("entry-unconfirmed", 1),
  };
  const examples = selectFewShotExamples(store as any);
  assert.strictEqual(examples.length, 1);
  assert.strictEqual(examples[0].entryId, "entry-confirmed");
});

test("few-shot gate: excludeEntryIds removes entries from confirmed pool", () => {
  const store = {
    "entry-a": makeCorrection("entry-a", 2, "2026-03-31T00:00:00Z"),
    "entry-b": makeCorrection("entry-b", 2, "2026-03-31T00:00:00Z"),
  };
  const examples = selectFewShotExamples(
    store as any,
    null,
    new Set(["entry-a"]),
  );
  assert.strictEqual(examples.length, 1);
  assert.strictEqual(examples[0].entryId, "entry-b");
});

// ---------------------------------------------------------------------------
// evidenceMap — buildEvidenceMap zone filtering (v37 structural enforcement)
// ---------------------------------------------------------------------------

import { buildEvidenceMap } from "../api/_shared/utils/evidenceMap.js";

const makeZone = (zoneType: string, text: string, weight = 0.7): any => ({
  zoneType,
  text,
  weight,
  position: 0,
  name: zoneType,
});

test("evidenceMap: jobFunction field excludes speaker zone text", () => {
  const zones = [
    makeZone("hero", "Built for marketing leaders and digital teams", 1.0),
    makeZone("speaker", "VP Engineering, Acme Corp", 0.4),
  ];
  const map = buildEvidenceMap(zones);
  assert.ok(
    map.jobFunction.text.includes("marketing leaders"),
    "hero text should appear in jobFunction evidence",
  );
  assert.ok(
    !map.jobFunction.text.includes("VP Engineering"),
    "speaker zone text must not leak into jobFunction evidence",
  );
});

test("evidenceMap: funnelStage field only includes cta zone text", () => {
  const zones = [
    makeZone("hero", "The composable content platform", 1.0),
    makeZone("cta", "Contact Sales — start your enterprise trial", 0.6),
  ];
  const map = buildEvidenceMap(zones);
  assert.ok(
    map.funnelStage.text.includes("Contact Sales"),
    "CTA text should appear in funnelStage evidence",
  );
  assert.ok(
    !map.funnelStage.text.includes("composable content"),
    "hero text must not appear in funnelStage evidence",
  );
});

test("evidenceMap: unknown-zone fallback — all unknown zones produce empty fields", () => {
  const zones = [
    makeZone("unknown", "Some component with unknown zone type", 0.5),
    makeZone("unknown", "Another unknown zone", 0.5),
  ];
  const map = buildEvidenceMap(zones);
  const nonEmpty = Object.values(map).filter(
    (ev: any) => ev.text.trim().length > 0,
  ).length;
  assert.strictEqual(
    nonEmpty,
    0,
    "all unknown zones should produce empty evidence fields",
  );
});

test("broad educational SEO pages blank unstable model-guessed job functions without explicit evidence", () => {
  const title = "What is Headless CMS? A Complete Guide";
  const slug = "/headless-cms";
  const text =
    'A headless CMS is a content management system that separates the content repository (the "body") from the presentation layer (the "head"). Unlike traditional CMS platforms, a headless CMS delivers content via APIs, enabling teams to build digital experiences across any channel.';
  const signals = extractContentSignals(slug, title, text);
  const classification = {
    assetType: { value: "Webpage", confidence: 0.99 },
    assetSubType: { value: ["Article"], confidence: 0.99 },
    schemaType: { value: "Article", confidence: 0.91 },
    product: { value: ["Platform"], confidence: 0.88 },
    jobLevel: {
      value: [
        "C-Level",
        "VP",
        "Director",
        "Manager",
        "Individual Contributor",
        "Consultant",
      ],
      confidence: 0.81,
    },
    jobFunction: {
      value: ["Engineering", "Marketing", "Product"],
      confidence: 0.81,
    },
    audience: { value: ["Prospect"], confidence: 0.81 },
    topic: { value: ["Headless CMS"], confidence: 0.81 },
    useCases: { value: ["Digital experiences"], confidence: 0.81 },
    funnelStage: { value: "Awareness (TOFU)", confidence: 0.81 },
    industry: { value: [], confidence: 0.81 },
    companySize: { value: [], confidence: 0.81 },
    region: { value: ["Global"], confidence: 0.81 },
    language: { value: "EN", confidence: 0.99 },
    usageRights: { value: "External", confidence: 0.99 },
    competitivePositioning: {
      mentionsCompetitors: false,
      competitorNames: [],
      competitorCategories: [],
      positioningType: "none",
    },
  };

  applyDeterministicRuntimePolicies({
    classification: classification as any,
    asset: {
      id: "headless-guide",
      title,
      contentType: "pageLongFormSeo",
      textContent: text,
      slug,
    },
    assetTitle: title,
    signals,
    companyData: undefined,
    allowedLabels: undefined,
    profile: null,
    contentQuality: "PARTIAL_BODY",
    semanticCeiling: 0.87,
    bodyCharCount: text.length,
    suspiciousEvidenceReasons: [],
  });

  assert.deepStrictEqual(classification.jobFunction.value, []);
});

test("broad educational API explainers keep deterministic Web Development hint", () => {
  const title = "What is an API? How APIs work, simply explained";
  const slug = "/guides/api";
  const text =
    "An API is a way for software systems to communicate. This guide explains endpoints, requests, responses, and why APIs matter for modern websites and apps. It is an educational primer, not reference documentation.";
  const signals = extractContentSignals(slug, title, text);
  const classification = {
    assetType: { value: "Webpage", confidence: 0.99 },
    assetSubType: { value: ["Article"], confidence: 0.99 },
    schemaType: { value: "Article", confidence: 0.91 },
    product: { value: ["Platform"], confidence: 0.88 },
    jobLevel: {
      value: [
        "C-Level",
        "VP",
        "Director",
        "Manager",
        "Individual Contributor",
        "Consultant",
      ],
      confidence: 0.81,
    },
    jobFunction: {
      value: ["Engineering", "Marketing"],
      confidence: 0.81,
    },
    audience: { value: ["Prospect"], confidence: 0.81 },
    topic: { value: ["Web Development"], confidence: 0.81 },
    useCases: { value: [], confidence: 0.81 },
    funnelStage: { value: "Awareness (TOFU)", confidence: 0.81 },
    industry: { value: [], confidence: 0.81 },
    companySize: { value: [], confidence: 0.81 },
    region: { value: ["Global"], confidence: 0.81 },
    language: { value: "EN", confidence: 0.99 },
    usageRights: { value: "External", confidence: 0.99 },
    competitivePositioning: {
      mentionsCompetitors: false,
      competitorNames: [],
      competitorCategories: [],
      positioningType: "none",
    },
  };

  applyDeterministicRuntimePolicies({
    classification: classification as any,
    asset: {
      id: "api-guide",
      title,
      contentType: "pageLongFormSeo",
      textContent: text,
      slug,
    },
    assetTitle: title,
    signals,
    companyData: undefined,
    allowedLabels: undefined,
    profile: null,
    contentQuality: "PARTIAL_BODY",
    semanticCeiling: 0.87,
    bodyCharCount: text.length,
    suspiciousEvidenceReasons: [],
  });

  assert.deepStrictEqual(classification.jobFunction.value, ["Web Development"]);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
