import { z } from "zod";
import { CLASSIFIER_PROMPT_VERSION } from "../config/classifierPipeline.js";
import {
  AUDIENCE_LABELS,
  COMPANY_SIZE_LABELS,
  COMPETITIVE_CATEGORY_ALTERNATIVE_LABELS,
  COMPETITIVE_NAMED_COMPETITOR_LABELS,
  COMPETITIVE_POSITIONING_TYPE_LABELS,
  FUNNEL_STAGE_LABELS,
  JOB_LEVEL_LABELS,
  LANGUAGE_LABELS,
  REGION_LABELS,
  SEASON_LABELS,
} from "../config/taxonomyDefinition.js";

const MultiValueField = z.object({
  value: z.array(z.string()),
  confidence: z.number(),
});

const SingleValueField = z.object({
  value: z.string(),
  confidence: z.number(),
});

const NullableSingleValueField = z
  .object({
    value: z.string().nullable().optional(),
    confidence: z.number().optional(),
  })
  .nullable()
  .optional();

export const ClassificationFactsSchema = z.object({
  assetType: SingleValueField,
  assetSubType: MultiValueField,
  schemaType: SingleValueField,
  product: MultiValueField,
  topic: MultiValueField,
  useCases: MultiValueField,
  industry: MultiValueField,
  companySize: z.object({
    value: z.array(z.enum(COMPANY_SIZE_LABELS)),
    confidence: z.number(),
  }),
  region: z.object({
    value: z.array(z.enum(REGION_LABELS)),
    confidence: z.number(),
  }),
  language: z.object({
    value: z.enum(LANGUAGE_LABELS),
    confidence: z.number(),
  }),
  usageRights: SingleValueField,
  event: NullableSingleValueField,
  eventType: NullableSingleValueField,
  season: z
    .object({
      value: z.enum(SEASON_LABELS).nullable().optional(),
      confidence: z.number().optional(),
    })
    .nullable()
    .optional(),
  yearPublished: z
    .object({
      value: z
        .string()
        .nullable()
        .optional()
        .describe(
          "4-digit year only (e.g. 2024). Null if unknown. Must be exactly 4 digits — no other text.",
        ),
      confidence: z.number().optional(),
    })
    .nullable()
    .optional(),
  factReasoning: z.string().describe("One line per fact field: 'fieldName: [TAG] short reason'. Tags: [LOCKED],[SIGNAL],[ENRICHMENT],[AI]. Every field listed once. If empty: 'left blank — no evidence in content'."),
});

export const ClassificationSubjectiveSchema = z.object({
  jobLevel: z.object({
    value: z.array(z.enum(JOB_LEVEL_LABELS)).describe("If content is level-agnostic (general explainer, glossary, broad educational page), emit ALL 6 levels: C-Level, VP, Director, Manager, Individual Contributor, Consultant. Only narrow the list when there are clear seniority signals."),
    confidence: z.number(),
  }),
  jobFunction: MultiValueField,
  audience: z.object({
    value: z.array(z.enum(AUDIENCE_LABELS)),
    confidence: z.number(),
  }),
  funnelStage: z.object({
    value: z.enum(FUNNEL_STAGE_LABELS),
    confidence: z.number(),
  }),
  competitivePositioning: z.object({
    mentionsCompetitors: z.boolean(),
    competitorNames: z.array(z.enum(COMPETITIVE_NAMED_COMPETITOR_LABELS)).optional(),
    competitorCategories: z.array(z.enum(COMPETITIVE_CATEGORY_ALTERNATIVE_LABELS)).optional(),
    positioningType: z.enum(COMPETITIVE_POSITIONING_TYPE_LABELS).optional(),
  }),
  reasoning: z.string(),
});

export type PromptSections = {
  contentQualityBlock: string;
  signalBlock: string;
  companyBlock: string;
  contentBlock: string;
  allowedBlock: string;
  fewShotBlock: string;
  assetId: string;
  contentType: string;
};

const FACT_RULES = `
Focus only on objective, evidentiary classification fields:
- assetType
- assetSubType
- schemaType
- product
- topic
- useCases
- industry
- companySize
- region
- language
- usageRights
- event
- eventType
- season
- yearPublished

Rules:
- Prefer explicit signals, URL structure, company enrichment, and grounded content evidence.
- Use exact allowed labels where provided.
- Keep multi-select fields tight: choose at most 3 values by default, and at most 4 only for genuinely broad educational TOFU content. Exception: jobLevel — if the content is truly level-agnostic (e.g. broad explainer, educational guide with no seniority signals), emit ALL applicable levels rather than arbitrarily picking a subset.
- Do not invent product labels or taxonomy values.
- Generic horizontal platform product pages should usually resolve to product=Platform, topic=Headless CMS, useCases=Digital experiences, and industry=Software, IT & Technology.
- On generic platform pages, do not expand to AI, Personalization, General business, or Experimentation from secondary body mentions alone. Title, slug, and primary headings carry more weight than buried feature blurbs.
- For case studies and resource pages: if the content prominently features a specific Contentful product (e.g. Personalization, AI actions, Compose), add it alongside Platform — multi-select up to 3 values.
- product is multi-select: emit all products that are central to the page, not just the most generic one.
- Industry should reflect the page's target vertical, not incidental customer logos or adjacent brand mentions.
- If no explicit vertical signal exists, leave industry empty unless the page is clearly a generic software/platform page.
- Migration and Replatforming belong in topic, not useCases.
- If Personalization is already captured by the product field, avoid duplicating it in topic/useCases unless the page is truly about personalization as a broader concept rather than the product.
- Season is only for time-bound campaigns or event-like content. Never use Season for evergreen pages.
- Webinar pages stay Webinar even when they are live, on-demand, recap, recording, or registration pages. Event is only for physical in-person events.
- GDPR references imply Global relevance, not EMEA-only targeting.
- If a field is marked as an override in the signal block, copy it exactly.
- When [EVIDENCE:field] blocks are present in Section 3, each block contains ONLY the zones pre-approved for that field. Use each block exclusively for its named field — do not cross-reference between evidence blocks.
- Confidence must reflect the evidence ceiling in Section 0.
- factReasoning: Write EXACTLY ONE SHORT LINE PER FACT FIELD. Put each on its own line.
  Format: "fieldName: [TAG] short reason"
  Tags: [LOCKED] = fixed by content type profile, [SIGNAL] = from URL/slug/metadata signal, [ENRICHMENT] = from company data, [METADATA] = from existing entry metadata, [AI] = model inference from content.

  Hard requirements:
  - Keep each reason concise: target 4-12 words, hard max 18 words after the tag.
  - Every listed field must appear exactly once in this order.
  - No intro, no conclusion, no bullets, no numbering.
  - Do not emit a final-value dump or snapshot block.
  - If a field is empty, write "left blank — no evidence in content".

  assetType: [LOCKED] or [SIGNAL] — content type or URL determined this
  assetSubType: [LOCKED] or [AI] — why this sub-type fits
  schemaType: [LOCKED] or [AI] — SEO schema rationale
  product: [AI] or [SIGNAL] — which products appear in title/headings/body
  topic: [AI] — dominant themes from headings and body content
  useCases: [AI] or [METADATA] — specific outcomes or use cases discussed
  industry: [AI] or [ENRICHMENT] — target vertical or company enrichment source
  companySize: [AI] or [ENRICHMENT] — revenue/scale evidence or enrichment source
  region: [SIGNAL] or [AI] — locale signal or geographic language evidence
  language: [SIGNAL] — from URL locale or content language detection
  usageRights: [SIGNAL] — from content type or publication context
  event: [AI] or [METADATA] — event name if content is tied to a specific event, else "left blank"
  eventType: [AI] — webinar/conference/meetup/etc. if applicable, else "left blank"
  season: [AI] — campaign season (Spring/Summer/Fall/Winter) if time-bound content, else "left blank"
  yearPublished: [SIGNAL] or [AI] — publication year from metadata or content date reference, else "left blank"

  Omit event/eventType/season/yearPublished lines only if ALL FOUR are empty and the content is clearly evergreen. If any one has a value, include all four.
\``;

const SUBJECTIVE_RULES = `
Focus only on subjective or audience-dependent fields:
- jobLevel
- jobFunction
- audience
- funnelStage
- competitivePositioning
- reasoning

Rules:
- Treat the fact classification block as locked context unless the content clearly contradicts it.
- Resolve funnelStage and jobLevel independently from the same content evidence. They may correlate, but neither field determines the other.
- Funnel stage is about buyer journey intent, CTA strength, and page structure.
- Job level is about the seniority and strategic depth of the content's intended reader.
- jobLevel decision tree:
  1. If the content has CLEAR seniority signals (executive language, strategic depth, technical hands-on), select ONLY the levels supported by evidence. Transformational/strategic content skews Director+. Hands-on tutorials skew Individual Contributor.
  2. If the content is level-agnostic (general explainer, glossary, intro guide, broad educational SEO page with NO seniority signals), you MUST emit ALL 6 levels: C-Level, VP, Director, Manager, Individual Contributor, Consultant. Do NOT pick a random subset of 3 — that is wrong.
  3. Case studies are Consideration (MOFU), not BOFU.
- If the seniority evidence is mixed, sparse, or ambiguous, preserve uncertainty rather than forcing a narrower level.
- Normalize explicit role evidence onto the governed job-function taxonomy, but do not invent roles that the page does not clearly support.
- jobFunction MUST emit at least one value if the content addresses any professional role at all. Only leave empty if the content has zero role signals (e.g. pure product changelog, legal page).
- jobFunction is about the primary buyer or evaluator roles the page targets, not every team that could use the product.
- Funnel stage must follow CTA and page-structure evidence before tone-based inference. When [EVIDENCE:funnelStage] is present it contains ONLY CTA text — use it exclusively.
- When [EVIDENCE:jobFunction] is present it contains ONLY hero/summary audience-addressing language. Do not infer jobFunction from speaker titles or quote blocks — that evidence was structurally excluded.
- When [EVIDENCE:jobLevel] is present it contains hero/summary/speaker zones. Speaker titles ARE valid seniority signals for level (not function).
- Audience: classify who the content is intended for using the allowed labels (Prospect, Direct Customer, Solution / Agency Partner, Tech / Platform / ISV Partner, Contentful community, Internal). Public-facing educational, SEO, and marketing content should be "Prospect". Use "Direct Customer" for help docs, release notes, or customer-only material. Use "Internal" only for internal-facing content. Multi-select if content clearly serves multiple groups.
- When in doubt between empty and "Prospect", prefer "Prospect" — most externally published content targets prospects.
- competitivePositioning must use the controlled taxonomy below.
- Named competitors are only: ${COMPETITIVE_NAMED_COMPETITOR_LABELS.join(", ")}.
- Category alternatives are only: ${COMPETITIVE_CATEGORY_ALTERNATIVE_LABELS.join(", ")}.
- Positioning type must be one of: ${COMPETITIVE_POSITIONING_TYPE_LABELS.join(", ")}.
- Customer logos, proof-point brands, agencies, partners, and ecosystem tools are NOT competitors.
- Do not treat brands like DocuSign, Kraft Heinz, Mailchimp, Smartling, Salesforce, Google, Apple, Propane, Shopstory, or Frosmo as competitors unless the page explicitly frames them as alternatives or direct comparison targets.
- Only set mentionsCompetitors=true when the page clearly positions Contentful against a named competitor or category-level incumbent.
- reasoning: Write EXACTLY ONE SHORT LINE PER SUBJECTIVE FIELD. Put each on its own line.
  Format: "fieldName: [TAG] short reason"
  Tags: [LOCKED] = fixed by policy/signal, [AI] = your inference from content.

  Hard requirements:
  - Keep each reason concise: target 4-12 words, hard max 18 words after the tag.
  - Every listed field must appear exactly once, in the order shown below.
  - No intro, no conclusion, no bullets, no numbering, no paragraph prose.
  - Do not emit "FINAL OUTPUT SNAPSHOT" or any final-value dump.
  - Keep the wording reviewer-friendly: short evidence phrases, not chain-of-thought prose.
  - If a field is empty, write "left blank — no evidence".

  funnelStage: [LOCKED] or [AI] — CTA/page-structure evidence for buyer journey stage
  jobLevel: [AI] — seniority evidence from hero/summary/speaker content
  jobFunction: [AI] — primary buyer/evaluator roles targeted in hero/summary language
  audience: [AI] — specific group targeted, or "left blank — no specific audience"
  competitivePositioning: [AI] — competitor framing evidence, or "left blank — no competitors"
- Confidence must reflect the evidence ceiling in Section 0.
`;

export function buildFactPrompt(sections: PromptSections): string {
  return `You are the factual stage of the Contentful taxonomy pipeline.
Prompt version: ${CLASSIFIER_PROMPT_VERSION}

Return only structured JSON matching the schema.
Do not reason about buyer psychology or marketing subjectivity in this stage.

${FACT_RULES}

${sections.contentQualityBlock}
${sections.signalBlock}
${sections.companyBlock}
${sections.contentBlock}
${sections.allowedBlock}
${sections.fewShotBlock}

ASSET METADATA
ID: ${sections.assetId}
Content Type: ${sections.contentType}

REQUIRED OUTPUT: factReasoning
Before returning JSON, fill the factReasoning field with ONE LINE PER FACT FIELD in this format:
  fieldName: [TAG] short reason (4-12 words)
Tags: [LOCKED] fixed by profile, [SIGNAL] from URL/slug/metadata, [ENRICHMENT] from company data, [AI] model inference.
Include every fact field exactly once. If empty, write: "left blank — no evidence in content".
`;
}

export function buildSubjectivePrompt(
  sections: PromptSections & { factSummaryBlock: string },
): string {
  return `You are the subjective stage of the Contentful taxonomy pipeline.
Prompt version: ${CLASSIFIER_PROMPT_VERSION}

Return only structured JSON matching the schema.
Do not re-decide the objective facts unless the supplied fact block is obviously impossible.

${SUBJECTIVE_RULES}

${sections.contentQualityBlock}
${sections.signalBlock}
${sections.companyBlock}
${sections.contentBlock}
${sections.allowedBlock}
${sections.fewShotBlock}

LOCKED FACT CLASSIFICATION
${sections.factSummaryBlock}

ASSET METADATA
ID: ${sections.assetId}
Content Type: ${sections.contentType}
`;
}

export function buildFactSummaryBlock(
  facts: z.infer<typeof ClassificationFactsSchema>,
): string {
  const lines = [
    `Asset Type: ${facts.assetType.value}`,
    `Asset Sub-Type: ${(facts.assetSubType.value || []).join(", ") || "none"}`,
    `Schema Type: ${facts.schemaType.value}`,
    `Product: ${(facts.product.value || []).join(", ") || "none"}`,
    `Topic: ${(facts.topic.value || []).join(", ") || "none"}`,
    `Use Cases: ${(facts.useCases.value || []).join(", ") || "none"}`,
    `Industry: ${(facts.industry.value || []).join(", ") || "none"}`,
    `Company Size: ${(facts.companySize.value || []).join(", ") || "none"}`,
    `Region: ${(facts.region.value || []).join(", ") || "none"}`,
    `Language: ${facts.language.value}`,
    `Usage Rights: ${facts.usageRights.value}`,
  ];
  if (facts.factReasoning) {
    lines.push(`\nFact-stage reasoning:\n${facts.factReasoning}`);
  }
  return lines.join("\n");
}
