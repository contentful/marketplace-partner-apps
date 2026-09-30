# Content Classifier — Runtime Logic

> Last updated: 2026-04-02
>
> **v42.2 (2026-04-02)** — MVP readiness follow-through. Bumped prompt version to `2026-04-02-evidence-v10`. The subjective prompt now explicitly says to "preserve uncertainty rather than forcing a narrower level" for ambiguous seniority evidence, restoring the governed prompt contract checked by `scripts/test-classifier.ts`. Deterministic replay fixtures now align the API explainer SEO page with the current job-function taxonomy label (`Web Development`, not the legacy `Developers`). Added `scripts/check-classifier-repeatability.ts` plus `npm run test:repeatability` to measure live field drift across repeated no-cache runs when Gemini/Vertex credentials are present. Follow-up hardening in the coercion layer now collapses compact spacing aliases such as `Web page` onto the canonical `Webpage` label before fallback scoring, fixing a live repeatability drift found on the platform pillar fixture. Broad educational SEO pages now also blank `jobFunction` unless explicit title/heading evidence or governed topic hints support a stable role mapping, which removed the remaining live drift on the headless CMS and French guide fixtures. Reviewer-facing wording now treats `jobFunction` as the page's primary buyer or evaluator roles and explicitly distinguishes post-processed values from human-corrected finals in the appended reasoning snapshot. This is an eval harness, not a deterministic guarantee.
>
> **v42.1 (2026-04-02)** — `yearPublished` determinism fix. The Gemini reasoning model was occasionally corrupting the `yearPublished` value by leaking internal JSON structure into the string field (triggered by a `[OVERRIDE — copy exactly]` prompt directive). This caused `AI_NoObjectGeneratedError` crashes because the Zod schema's `.regex(/^\d{4}$/)` rejected the entire model response when only one optional field was corrupted. Fix: (1) `classificationTool.ts` now force-writes `yearPublished` from `signals.override.yearPublished` after the model stage — signal-extracted years are always canonical and the model is never trusted for this value; (2) removed the `[OVERRIDE — copy exactly]` prompt directive and duplicate `Year Published` line in the signals block; (3) removed `.regex(/^\d{4}$/)` from `ClassificationFactsSchema` — format enforcement stays in post-processing where a corrupt value is cleared to null rather than crashing the classification. No prompt version change.
>
> **v42 (2026-04-01)** — Determinism hardening: full-pipeline hallucination audit and enforcement. The taxonomy now acts as both a prompt instruction AND an enforced output filter at every layer:
>
> **Schema layer**: `z.enum()` enforced on `funnelStage`, `jobLevel`, `audience`, `region`, `language`, `companySize`, `season` in both Zod schemas (previously all used `z.string()`). `yearPublished` constrained to `/^\d{4}$/` regex. `competitorNames`/`competitorCategories` use `z.enum()` from canonical label lists.
>
> **Coercion layer**: Coercion is now unconditional — falls back to `getStaticAllowedTaxonomyLabels()` when `allowedLabels` is not provided by the caller. `assetType` and `schemaType` added to the coercion block for the first time (backed by new `ASSET_TYPE_LABELS` / `SCHEMA_TYPE_LABELS` in `taxonomyDefinition.ts`). Reasoning-value consistency check extended from 2 fields to all 12 optional fields. Post-coercion `yearPublished` format guard clears any non–4-digit value.
>
> **Writeback layer**: Approve endpoint runs full coercion pass before Contentful write. Correct endpoint rejects non-taxonomy values with 400. `runUpdateGraph` now passes `allowedLabels`. `needs_review=true` path uses `writeFields: false` — AI fields are not written until a human approves.
>
> **Contamination gates**: Cache invalidates on `promptVersion` mismatch. Cache-hit path runs `applyReasoningConsistency()`. Few-shot store filters examples against current taxonomy (`isExampleValid()`). Auto-feedback loop filters approved fields through coercion before storing. History snapshots filtered to taxonomy-valid values.
>
> **Label fixes**: `"Healthcare & Life Sciences"` → `"Health & Wellness"`, `"Manufacturing"` → `"Manufacturing & Utilities"` in industry hints. `"Developers"` → `"Web Development"` in `topicJobFunctionMap`. Company search: removed "NEVER return null" instruction; default confidence `0.7` → `0.3`.
>
> **chore/types (2026-04-01)** — TypeScript strict typing: all explicit `any` annotations removed across 60 files. Zero `tsc --noEmit` errors. This is a type-safety refactor only — no runtime logic, prompt, policy, taxonomy, or classification behavior changed. Key structural changes: `recursiveCrawler.ts` introduces `EntryLike` and `CmaFieldValue` as shared types; API routes use typed cast patterns for `ClassificationResult` extras and `EdgeRel[]`; utilities type correction fields as `Record<string, string | string[]>`; scripts receive typed CMA SDK interop, `loadJson` generics, and `catch (err: unknown)` patterns. Shared infrastructure extracted: `scripts/_shared/scriptUtils.ts` (loadJson, getArgValue, hasFlag, requireEnv, getErrorMessage), `scripts/_shared/contentfulSetupTypes.ts` (AppDef, CmaOrg, CmaClient, CmaSpace, SidebarWidget, EditorInterface, normalizeSidebarApps, getAppDefinitionParameters), `api/_shared/types/classificationTypes.ts` (CmaEntry, ClassificationResultExtra). All tests green: 54 unit + 17 route. No prompt version change. No policy surface change.
>
> **v41.3** — factReasoning now reliably populated via Zod `.describe()`. Gemini's `generateObject` ignores optional string fields and prose prompt instructions for structured output; using the JSON Schema `description` property forces the model to populate the field. `factReasoning: z.string().describe(...)` — the AI SDK passes this as the JSON Schema `description` which Gemini reads as a field-level instruction. Fact prompt also gets a closing `REQUIRED OUTPUT: factReasoning` block as reinforcement. Both `FACT FIELDS` and `SUBJECTIVE FIELDS` now appear in the CSV `AI Reasoning` column for all live-run entries. Snapshot is stripped from CSV export but retained in history for audit.
>
> **v41.2** — Strip FINAL OUTPUT SNAPSHOT from reasoning output. Model was ignoring prompt instruction not to emit snapshot. Fix applied in three places: classificationTool.ts live path (mergedReasoning construction), classificationTool.ts cache hit path (cachedReasoning strip), and classify-pillar-pages.ts export (exportedReasoning). Cached entries now include their stored reasoning rather than blanking it — reviewers see the full explanation for every entry.
>
> **v41.1** — event/eventType/season/yearPublished added to factReasoning. These 4 fields now appear in the fact-stage reasoning block when any one has a value; omitted for clearly evergreen content where all four are empty.
>
> **v41** — Fact-stage reasoning + correct assetType profiles. `ClassificationFactsSchema` gains `factReasoning` field — the fact stage now explains where each of `product`, `topic`, `useCases`, `industry`, `companySize`, `region` came from (signal/enrichment/AI inference). The `reasoning` output is a merged block: `FACT FIELDS` + `SUBJECTIVE FIELDS`. `contentTypeProfiles.ts`: `assetType` corrected for all types — `"Document"` replaced with `"Webpage"` (SEO guides, glossary, pricing, solution, partner), `"Blog"` (blog posts), `"Case Study"` (case studies), `"Event"` (events), `null` (resources — AI decides). Hardcoded `"Document"` fallback fixed to `"Webpage"`. Prompt version: `2026-04-01-evidence-v8`. All tests: 54 unit + 17 route + 9 classifier = 80/80 green.
>
> **v40.3** — section_heading CT patterns, promptVersion in history, approve shape tests, pipeline smoke. `ZONE_CT_PATTERNS` now includes `section_heading` pattern — completes v40 fix (ZONE_NAME_PATTERNS was done, CT-based matching was missing). `HistoryEntry` now stores `promptVersion`. Route tests: 17 (was 14) — 2 approve shape validation tests + 1 Layer 1+evidenceMap pipeline smoke test. Golden accuracy: 100% (38/38 checks).
>
> **v40.2** — Golden gate restored; approve validation hardened; HistoryEntry schema extended. Golden accuracy: 38/38 checks (100%, 97.4% weighted). `ApproveBodySchema` now validates required classification fields (`assetType`, `funnelStage`, `language`, `schemaType`) via `ClassificationShapeSchema` before Contentful writeback. `HistoryEntry` extended with `reasoning?` and `competitivePositioning?` — batch-script classifications now persist these fields so cache hits can reconstruct `fieldProvenance` and return accurate competitor data.
>
> **v40.1** — Eng review test coverage. `selectFewShotExamples` exported for unit testing. Added 6 new unit tests: 3 covering the v40 P0 few-shot confirmation gate (empty confirmed set → `[]`; mixed pool → only confirmed; excludeEntryIds filtering) and 3 covering `buildEvidenceMap` structural enforcement (jobFunction excludes speaker; funnelStage is CTA-only; all-unknown produces empty evidence). Total: 54 unit tests.
>
> **v40** — Codex audit fixes. Five correctness gaps closed: (1) `feedbackStore.selectFewShotExamples` fallback that bypassed `confirmationCount >= 2` gate when no confirmed corrections existed — removed; (2) `companySize` and `region` moved from `scalarFields` to `arrayFields` in the approve route auto-feedback block — they are `string[]` not `string` in the classifier schema; (3) `section_heading` zone type added to `ZONE_NAME_PATTERNS` in `recursiveCrawler.ts` — was defined and weighted (0.8) but never emitted by `classifyZoneType()`; (4) `EVIDENCE_MAP_MIN_NONEMPTY_FIELDS` imported and wired into the unknown-zone fallback guard — was hardcoded to `=== 0`; (5) `parseReasoningToProvenance()` hardened to strip snapshot trailer blocks and accept numbered/mixed-case lines.
>
> **v39** — adversarial hardening. Three fixes from structured adversarial analysis: (1) `funnelStage` CTA zone sort flipped to weight-descending so the highest-intent CTA wins over position — prevents weak top-of-page CTAs from crowding out strong "Contact Sales" signals; (2) unknown-zone fallback guard added to `classificationTool.ts` — when all EvidenceMap fields are empty because every Contentful component fell through to `unknown` zone type, the evidence map is nulled and the prompt falls back to flat `textContent`; (3) P4 auto-feedback saves at `confirmationCount=1` to require a second confirmation before entering few-shot retrieval, preventing the LLM from training on its own approvals.
>
> **v38** — structured provenance and automated feedback loop. `ClassificationResult` now includes a `fieldProvenance` record (parsed from the reasoning string at classification time) — callers can query any field's `{ tag, reason }` without regex-scraping prose. The editor approval route (`api/review/[action].ts`, action=`approve`) now auto-saves a confirmed correction (`confirmationCount=2`) to the feedback store on every approval, closing the feedback loop: approved classifications immediately become few-shot candidates without a separate manual correction step.
>
> **v37** — prompt version `2026-03-27-evidence-v7`: structural per-field evidence enforcement. `api/_shared/utils/evidenceMap.ts` builds a typed `EvidenceMap` from `ContentZone[]` before any prompt is constructed — each field only receives text from its allowed zones (`jobFunction`: hero/summary only; `industry`: hero/summary/body, no footer; `funnelStage`: CTA zones only; `jobLevel`: hero/summary/speaker; `competitivePositioning`: hero/summary/body, no quotes). The `[EVIDENCE:field]` blocks in the prompt replace the `[ZONE:type]` dump + advisory routing rules from v36. Enforcement is now at the data layer, not the instruction layer.
>
> **v40.3** — section_heading CT patterns, promptVersion in history, approve shape tests, pipeline smoke. `ZONE_CT_PATTERNS` now includes `section_heading` pattern — completes v40 fix (ZONE_NAME_PATTERNS was done, CT-based matching was missing). `HistoryEntry` now stores `promptVersion`. Route tests: 17 (was 14) — 2 approve shape validation tests + 1 Layer 1+evidenceMap pipeline smoke test. Golden accuracy: 100% (38/38 checks).
>
> **v40.2** — Golden gate restored; approve validation hardened; HistoryEntry schema extended. Golden accuracy: 38/38 checks (100%, 97.4% weighted). `ApproveBodySchema` now validates required classification fields (`assetType`, `funnelStage`, `language`, `schemaType`) via `ClassificationShapeSchema` before Contentful writeback. `HistoryEntry` extended with `reasoning?` and `competitivePositioning?` — batch-script classifications now persist these fields so cache hits can reconstruct `fieldProvenance` and return accurate competitor data.
>
> **v40.1** — Eng review test coverage. `selectFewShotExamples` exported for unit testing. Added 6 new unit tests: 3 covering the v40 P0 few-shot confirmation gate (empty confirmed set → `[]`; mixed pool → only confirmed; excludeEntryIds filtering) and 3 covering `buildEvidenceMap` structural enforcement (jobFunction excludes speaker; funnelStage is CTA-only; all-unknown produces empty evidence). Total: 54 unit tests.
>
> **v40** — Codex audit fixes. Five correctness gaps closed: (1) `feedbackStore.selectFewShotExamples` fallback that bypassed `confirmationCount >= 2` gate when no confirmed corrections existed — removed; (2) `companySize` and `region` moved from `scalarFields` to `arrayFields` in the approve route auto-feedback block — they are `string[]` not `string` in the classifier schema; (3) `section_heading` zone type added to `ZONE_NAME_PATTERNS` in `recursiveCrawler.ts` — was defined and weighted (0.8) but never emitted by `classifyZoneType()`; (4) `EVIDENCE_MAP_MIN_NONEMPTY_FIELDS` imported and wired into the unknown-zone fallback guard — was hardcoded to `=== 0`; (5) `parseReasoningToProvenance()` hardened to strip snapshot trailer blocks and accept numbered/mixed-case lines.
>
> **v39** — adversarial hardening. Three fixes from structured adversarial analysis: (1) `funnelStage` CTA zone sort flipped to weight-descending so the highest-intent CTA wins over position — prevents weak top-of-page CTAs from crowding out strong "Contact Sales" signals; (2) unknown-zone fallback guard added to `classificationTool.ts` — when all EvidenceMap fields are empty because every Contentful component fell through to `unknown` zone type, the evidence map is nulled and the prompt falls back to flat `textContent`; (3) P4 auto-feedback saves at `confirmationCount=1` to require a second confirmation before entering few-shot retrieval, preventing the LLM from training on its own approvals.
>
> **v38** — structured provenance and automated feedback loop. `ClassificationResult` now includes a `fieldProvenance` record (parsed from the reasoning string at classification time) — callers can query any field's `{ tag, reason }` without regex-scraping prose. The editor approval route (`api/review/[action].ts`, action=`approve`) now auto-saves a confirmed correction (`confirmationCount=2`) to the feedback store on every approval, closing the feedback loop: approved classifications immediately become few-shot candidates without a separate manual correction step.
>
> **v37** — prompt version `2026-03-27-evidence-v7`: structural per-field evidence enforcement. `api/_shared/utils/evidenceMap.ts` builds a typed `EvidenceMap` from `ContentZone[]` before any prompt is constructed — each field only receives text from its allowed zones (`jobFunction`: hero/summary only; `industry`: hero/summary/body, no footer; `funnelStage`: CTA zones only; `jobLevel`: hero/summary/speaker; `competitivePositioning`: hero/summary/body, no quotes). The `[EVIDENCE:field]` blocks in the prompt replace the `[ZONE:type]` dump + advisory routing rules from v36. Enforcement is now at the data layer, not the instruction layer.
>
> **v36** — prompt version `2026-03-27-zone-v6`: zone-aware content extraction. The CDA crawler now returns a structured `ContentZone[]` alongside flat text, treating each depth-1 Contentful component as a named zone (hero, summary, subtitle, body, quote, speaker, cta, footer). The LLM prompt presents evidence with `[ZONE:type]` labels and explicit field routing rules: `jobFunction` uses only hero/summary explicit audience phrasing and ignores speaker titles; `industry` uses explicit vertical framing from hero/summary and suppresses footer company logo lists; `funnelStage` is resolved from CTA structure independently of topic or jobLevel; `competitivePositioning` uses body comparison language only and suppresses quote-zone mentions. Zone budgets are weighted (hero/summary=1.0, body=0.7, cta=0.6, quote/speaker=0.5, footer=0.2) so high-signal zones dominate prompt context.
> **v35** — case-study exports now keep fresh reasoning while still suppressing cached reasoning, case-study product selection defaults back to `Platform` unless the page title/slug explicitly signals a secondary product, and case-study role normalization now distinguishes target-role evidence from speaker titles: `jobFunction` requires explicit audience-style phrasing while `jobLevel` can still use scoped full-content title evidence
> **v34** — job-role normalization now uses a governed title-style config derived from mar ops aliases: exact titles, contains, and excludes map into the local taxonomy without relying on broad body-keyword guessing
> **v33** — job-function and job-level normalization moved toward stricter role-family evidence, reducing casual role inflation from weak page context
> **v32** — audience and industry now follow stricter metadata best practices: `audience` stays blank unless the page explicitly addresses a real audience class, and `industry` prefers explicit vertical evidence over incidental logos or weak model guesses
> **v31** — competitive positioning is now a controlled taxonomy: only named competitors from the governed allowlist or category-level incumbents (`Legacy CMS`, `Monolithic CMS`, `Monolithic Ecommerce Platform`) survive post-processing; customer logos and unrelated brands are stripped from the field. Job-function normalization now maps explicit engineering/web evidence into the governed taxonomy without forcing generic platform pages back into a broader default bundle, and job-level cleanup preserves uncertainty unless the page explicitly supports a narrower executive inference.
> **v30** — policy version `2026-03-24-enterprise-v25`: structured bulk runs can now shrink the fact-stage body excerpt via caller-controlled limits, with case-study batches defaulting to a smaller 1200-char fact context
> **v29** — policy version `2026-03-24-enterprise-v24`: bulk case-study reruns now skip dynamic few-shot retrieval by default and can reuse unchanged CSV rows before crawl/classify. The batch script still supports explicit override flags when you want a full rerun.
> **v28** — prompt version `2026-03-24-chain-v5`: subjective reasoning must stay concise by construction. The model is instructed to emit exactly one short line per field, in order, with a hard cap of 18 words after the tag and no final snapshot dump in the model-written reasoning.
> **v27** — prompt version `2026-03-19-chain-v4`: body summaries are capped to 4k chars, the subjective stage uses compressed context without replaying few-shot/company blocks, and the default subjective model now falls back to `gemini-2.5-flash-lite` for lower latency
> **v26** — `classificationTool.ts` is now a thinner orchestration boundary: deterministic post-processing and review routing live in `classificationRuntimePolicy.ts`, and the dead inline taxonomy primer was removed from runtime code
> **v25** — case study funnel policy is now governed as MOFU, and generic platform pages no longer hard-override `jobFunction` or `jobLevel`; those stay model-decided from page evidence
> **v24** — removed funnelStage→jobLevel dependency: subjective prompt now resolves them independently, TOFU educational cleanup no longer blanks jobLevel, and consistency checks no longer treat executive job level as a funnel-stage override
> **v23** — prompt version `2026-03-19-chain-v2`: generic platform product pages now bias natively toward `Platform + Headless CMS + Software, IT & Technology`, prompt guardrails suppress body-only AI/personalization/experimentation inflation, and confidence docs now explicitly call out field-level semantic calibration gaps
> **v22** — governed classifier boundary: semantic confidence fields moved into classifierPolicy.ts, title sanitization now flows through policy-backed support helpers, extracted support/profile modules are covered by deterministic classifier regression checks
> **v21** — API auth (X-App-Token), unit tests (17 passing), metadata handles reference fields, CDA token safety
> **v20** — repo readiness: README.md, .env.example, metadata handles reference fields, CDA token safety, removed recommendedActions fully, changelog updated
> **v19** — case study company enrichment: only enrich the featured customer (first mentioned company), not every brand on the page. Prevents random logos/partners from skewing industry/companySize. Fixed reasoning split regex.
> **v18** — relaxed funnel stage locks: case studies allow MOFU+BOFU (was BOFU-only), blog/longFormSeo allow BOFU, resources allow TOFU. Resource schemaType now AI-decides. AI infers funnel stage from content evidence.
> **v17** — reasoning now explicitly lists every field with "fieldName: [TAG] value — why" format, one per line. Includes both fact-stage and subjective-stage fields.
> **v16** — fixed root cause: SUBJECTIVE_RULES in classifierPrompts.ts said "top 3 decisions in 2-4 sentences", overriding the every-field rule. Now says cover ALL fields with tags. Removed recommendedActions from subjective schema.
> **v15** — confidence cap expanded to ALL AI-inferred fields (not just 6 semantic), reasoning must cover every field explicitly
> **v14** — semantic confidence capped at 97% for FULL_BODY (100% is never real)
> **v13** — entry metadata hard overrides AI inference (author-set values always win)
> **v12** — parent page lookup for child content types (caseStudy→pageCaseStudy)
> **v11** — CDA-first crawl with Management API fallback, existing entry metadata as ground truth
> **v10** — removed recommendedActions from schema and sidebar
> **v9** — audience left blank when content has no specific target
> **v8** — pickTop keeps all AI values up to field max, raised caps (topic/useCases 3, audience 3)
> **v7** — concise tagged reasoning: LOCKED/SIGNAL/ENRICHMENT/METADATA/AI
> **v6** — reasoning covers every field with evidence, not just top 3
> **v5** — needsReview calibration-gate removed, cron allowedLabels, sidebar full taxonomy
> **v4** — full 4-layer pipeline in sidebar (slug, executionMode=default, nameInternal)

This document reflects the current vendor-integrated classifier runtime.

## Change Standard

Classifier changes are governed, not improvised.

- Runtime classifier changes must ship with a companion policy, prompt, or calibration asset change.
- Runtime classifier changes must ship with a docs update.
- Runtime classifier changes must ship with an evaluation or calibration artifact update.
- Default verification path: `npm run verify:classifier`

Install the local hook:

```bash
npm run hooks:install
```

The hook runs [check-classifier-governance.mjs](../../scripts/check-classifier-governance.mjs).

CI uses the same governed path through [golden-dataset.yml](../../.github/workflows/golden-dataset.yml), which runs `npm run verify:classifier`.

Supporting governance files:

- [classifierPolicy.ts](../../api/_shared/config/classifierPolicy.ts)
- [classifierPipeline.ts](../../api/_shared/config/classifierPipeline.ts)
- [CLASSIFIER_CHANGELOG.md](../governance/CLASSIFIER_CHANGELOG.md)

## Runtime Shape

```text
Contentful webhook / batch script
        |
        v
queue + crawler
        |
        v
[Layer 1] deterministic signals + NLP sidecar
        |
        v
[Layer 2] company enrichment + retrieval context
        |
        v
[Layer 3] chained Gemini / Vertex classification
        |
        v
[Layer 4] policy enforcement + confidence + review routing
        |
        +--> Contentful writeback
        +--> review queue / review tag
        +--> observability traces
```

## Vendor Integration Points

### Model Transport

- [googleProvider.ts](../../api/_shared/utils/googleProvider.ts)

This module decides whether the runtime uses:

- direct Gemini via `@ai-sdk/google`
- Vertex AI via `@ai-sdk/google-vertex`

The classifier, embeddings, and some enrichment paths use this provider abstraction instead of calling Gemini directly.

### Layer 1: Deterministic Signals + NLP Sidecar

- [contentSignals.ts](../../api/_shared/utils/contentSignals.ts)
- [nlpPipeline.ts](../../api/_shared/utils/nlpPipeline.ts)

This layer combines:

- URL normalization (locale prefix stripping: `/en-us/blog/x` → `/blog/x`)
- URL and content-type heuristics
- CTA and structural signal extraction
- language and usage-right detection
- GLiNER entity extraction
- zero-shot intent classification from the local NLP sidecar

The sidecar is the non-LLM pre-processor that reduces regex brittleness and improves grounding before generation.

### Layer 2: Company Enrichment + Dynamic Few-Shot Retrieval

- [companyCache.ts](../../api/_shared/utils/companyCache.ts)
- [feedbackStore.ts](../../api/_shared/utils/feedbackStore.ts)
- [chromaStore.ts](../../api/_shared/utils/chromaStore.ts)

This layer adds:

- company-industry and company-size hints
- vector retrieval of the most relevant reviewed corrections
- correction-backed few-shot context

Chroma is the active retrieval store for semantic few-shot selection.

### Layer 3: Chained Classification

- [classificationTool.ts](../../api/_shared/tools/classificationTool.ts)
- [classifierPrompts.ts](../../api/_shared/prompts/classifierPrompts.ts)

The classifier no longer uses one monolithic prompt.

The runtime is also no longer one monolithic file. [classificationTool.ts](../../api/_shared/tools/classificationTool.ts) is the orchestration boundary, while deterministic support policy lives in:

- [contentTypeProfiles.ts](../../api/_shared/config/contentTypeProfiles.ts)
- [classificationSupport.ts](../../api/_shared/utils/classificationSupport.ts)
- [classificationRuntimePolicy.ts](../../api/_shared/tools/classificationRuntimePolicy.ts)

It does two generation steps:

1. facts stage
   - asset shape
   - schema
   - product
   - topic
   - use cases
   - industry
   - company size
   - region
   - language
2. subjective stage (receives frozen facts as locked context)
   - funnel stage
   - job level
   - job function
   - audience
   - competitive positioning, but only through the controlled competitor taxonomy

`funnelStage` and `jobLevel` are resolved independently from shared content evidence. They can correlate, but one is not a derived field of the other.

Generic platform product pages still get hard taxonomy guardrails for `product`, `topic`, and `industry`, but `jobFunction` and `jobLevel` are no longer force-set in post-processing.

Those stages run against the provider selected by [googleProvider.ts](../../api/_shared/utils/googleProvider.ts), which can be direct Gemini or Vertex.

Reviewer-facing exports should now expect concise model reasoning from the subjective stage itself, not a long narrative blob. The intended format is one short field-scoped line per AI or locked decision; any snapshot-style full-field dump is considered post-processing noise rather than reviewer content.

### Layer 4: Policy Enforcement, Confidence, Review Routing

- [classifierPolicy.ts](../../api/_shared/config/classifierPolicy.ts)
- [confidenceCalibration.ts](../../api/_shared/utils/confidenceCalibration.ts)
- [contentfulAppTool.ts](../../api/_shared/tools/contentfulAppTool.ts)
- [reviewQueue.ts](../../api/_shared/utils/reviewQueue.ts)

This layer handles:

- allowed-label coercion
- multi-select limits
- internal-title cleanup
- deterministic overrides
- audience: left blank unless the page explicitly targets customers, partners, community, internal users, or a clearly named audience class
- industry: explicit solution/vertical evidence beats weak model guesses; incidental logos do not define target industry
- correction quality gating: only confirmed corrections (confirmationCount >= 2) used as few-shot examples
- ambiguity flags: tags the few remaining runtime conflict monitors that still trigger review
- confidence handling
- review thresholds
- Contentful writeback or review routing

## Policy Surface

The current policy surface is split into:

- [classifierPolicy.ts](../../api/_shared/config/classifierPolicy.ts)
  - field caps
  - title sanitization
  - calibration minimums
  - governed confidence summary fields and semantic review fields
  - bulk batch defaults for dynamic few-shot retrieval
- [classifierPipeline.ts](../../api/_shared/config/classifierPipeline.ts)
  - model IDs
  - vendor requirement flags
  - review thresholds
  - lower-latency default subjective-stage model
- [classifierPrompts.ts](../../api/_shared/prompts/classifierPrompts.ts)
  - prompt-stage structure
  - field responsibilities
  - generic platform guardrails that keep `topic` and `industry` from inflating off secondary feature mentions
  - compressed subjective-stage context to reduce prompt weight
  - concise per-field reasoning contract for reviewer-facing exports
- [JOB_ROLE_NORMALIZATION.md](./JOB_ROLE_NORMALIZATION.md)
  - governed role/title normalization structure
  - source-family mapping and precedence

## Bulk Run Speedups

The bulk script now applies two guarded speedups before it ever reaches Gemini:

- unchanged entries can be reused from the latest native CSV export when the Contentful entry has not changed since the last recorded classification
- `pageCaseStudy` and `caseStudy` bulk runs skip dynamic few-shot retrieval by default because the added retrieval context was low-yield compared with the prompt and latency cost on these structured pages

Operator overrides:

- `--no-reuse-unchanged` forces every row back through crawl + classify
- `--skip-few-shot` disables dynamic few-shot for any content type
- `--use-few-shot` re-enables dynamic few-shot for case-study bulk runs

## Confidence Meaning

Confidence now has two states:

- raw or heuristic confidence
- data-backed calibrated confidence

Calibration is only applied when there is enough reviewed overlap data.

Key files:

- [confidenceCalibration.ts](../../api/_shared/utils/confidenceCalibration.ts)
- [confidence-calibration.json](../../seeds/confidence-calibration.json)
- [calibrate-confidence.ts](../../scripts/calibrate-confidence.ts)
- [classifierPolicy.ts](../../api/_shared/config/classifierPolicy.ts)

Calibration data-backing is tracked but no longer forces `needsReview`. Previously, insufficient calibration data (< 25 reviewed examples) would flag every classification as needing review regardless of confidence. Now `needsReview` only triggers on actual low confidence: overall < 0.75 or weakest semantic field < 0.6. The exact semantic fields that participate in that review path are versioned in [classifierPolicy.ts](../../api/_shared/config/classifierPolicy.ts) instead of being hardcoded only inside runtime code. Calibration progress is shown as `[info]` advisories in review signals, including both overall progress and field-level semantic coverage gaps, so users can see when `topic`, `industry`, or other semantic fields are still running on raw confidence at the current band.

## Queue And Review Flow

Queue-first processing is part of the classifier runtime, not a separate concern.

- [contentful-classify.ts](../../api/webhooks/contentful-classify.ts)
- [api/cron/[job].ts](../../api/cron/[job].ts)
- [reviewQueue.ts](../../api/_shared/utils/reviewQueue.ts)
- [api/review/[action].ts](../../api/review/[action].ts)

The normal path is:

1. webhook enqueues job
2. worker claims job
3. crawler builds text payload
4. classifier runs
5. result is either written back or sent to review

## Interactive Profile

The Entry Sidebar request path now uses the real classifier flow, not a synthetic or stubbed interactive variant.

Purpose:

- keep the real deep-crawl + chained-classifier flow
- keep runtime behavior aligned with the queue path for the core classification logic
- reduce latency through bounded inputs and lighter prompt/model choices rather than disabling core reasoning steps

Current interactive-route behavior:

- static allowed taxonomy labels are used for the request instead of loading org taxonomy labels live
- NLP sidecar enrichment still runs when configured
- dynamic few-shot retrieval still runs when configured
- company enrichment remains policy-controlled by page/profile logic, not by a separate fake sidebar mode

Files:

- [execute.ts](../../api/tools/[tool]/execute.ts)
- [classificationTool.ts](../../api/_shared/tools/classificationTool.ts)
- [classifierPolicy.ts](../../api/_shared/config/classifierPolicy.ts)

The queue/batch path still differs in orchestration and review/writeback side effects, but the sidebar path is not using a dummy classifier profile.

## Observability

- [observability.ts](../../api/_shared/utils/observability.ts)

The runtime records:

- prompt version
- selected few-shot examples
- timing and latency
- confidence metadata
- field outputs
- review reasons

Phoenix is the active local trace target. LangSmith is optional.

## Local Enterprise Stack

See:

- [HOW_THE_APP_WORKS.md](./HOW_THE_APP_WORKS.md)
- [ENTERPRISE_VENDOR_SETUP.md](./ENTERPRISE_VENDOR_SETUP.md)

The current local stack includes:

- Postgres
- Chroma
- NLP sidecar
- Phoenix
- Contentful
- Gemini or Vertex
