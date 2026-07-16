# Classifier Changelog

This file records classifier policy and pipeline changes in a human-reviewable format.

Each entry should capture:

- date
- policy/config version
- what changed
- previous behavior
- new behavior
- why it changed
- what validation was run

---

## 2026-04-02 — Prompt contract restore + repeatability eval (v42.2)

Policy version: `2026-04-02-evidence-v10`

What changed:

- Bumped the default classifier prompt version to `2026-04-02-evidence-v10`.
- Restored the governed subjective-prompt instruction to preserve uncertainty rather than forcing a narrower `jobLevel` when seniority evidence is mixed or weak.
- Updated the committed API explainer replay fixture to the current taxonomy label `Web Development` instead of the legacy `Developers`.
- Added `scripts/check-classifier-repeatability.ts` and `npm run test:repeatability` to run repeated no-cache live classifications and report field-level drift when model credentials are present.
- Hardened taxonomy coercion so compact-spacing aliases like `Web page` collapse onto canonical labels like `Webpage` before Jaccard fallback.
- Broad educational SEO pages now clear `jobFunction` unless there is explicit role evidence or a governed topic-hint mapping, eliminating live repeatability drift on the headless CMS and French guide fixtures.
- Follow-up cleanup centralized the educational topic-to-job-function policy and extracted the repeatability harness into smaller helpers so the new determinism hardening stays readable and easier to maintain.

Previous behavior:

- `scripts/test-classifier.ts` was red because the governed prompt contract check no longer matched the actual subjective prompt wording.
- The API explainer replay fixture expected an outdated job-function label and no longer matched deterministic runtime normalization.
- The repo had no first-party harness for repeated live-run stability; only deterministic replay and signal checks existed.

Why it changed:

- A classifier MVP is only trustworthy if the governed contract is green again and live-run variance is measurable.
- This closes the obvious red gate first, then adds an eval path and hardening passes for the remaining non-deterministic surface.

Validation:

- `npm run check`
- `node --import tsx scripts/test-classifier.ts`
- `npm run test:unit`
- `npm run test:routes`
- `npm run test:golden`
- `npm run test:repeatability -- --runs 3`

## 2026-03-25 — Controlled competitive positioning taxonomy (v31)

Policy version: `2026-03-24-enterprise-v25`

What changed:

- Competitive positioning now uses governed taxonomy lists for named competitors, category-level alternatives, and positioning types.
- Prompt instructions explicitly restrict Gemini to that controlled competitor taxonomy.
- Runtime post-processing now strips customer logos and unrelated brands from competitive positioning unless the content actually frames them competitively.
- Sidebar and app schema now surface both named competitors and category alternatives.

Previous behavior:

- Competitive positioning could carry arbitrary brand names from proof points or customer logos.
- The prompt did not constrain the field to a governed competitor taxonomy.

Why it changed:

- Competitive positioning is only useful if it is reviewable and consistent.
- Customer stories and logo-heavy pages were leaking non-competitor brands into the taxonomy.

Validation:

- `node --import tsx scripts/test-classifier.ts`
- `npm run test:unit`
- `npm run docs:check`
- `npm run check`

---

## 2026-03-24 — Structured bulk fact-context compaction (v30)

Policy version: `2026-03-24-enterprise-v25`

What changed:

- Added governed per-content-type defaults for fact-stage body excerpt limits during bulk runs.
- Case-study bulk runs now default to a `1200`-character fact-stage body excerpt.
- `classificationTool.ts` now accepts a caller-controlled `factContentLimit` so batch callers can reduce prompt weight without changing sidebar/default runtime behavior.
- `scripts/classify-pillar-pages.ts` exposes `--fact-content-limit` and logs the effective fact-stage body limit for the run.

Previous behavior:

- The fact-stage prompt always sent up to roughly `2000` characters of body excerpt, even for structured case-study batches where the extra context had diminishing value.

Why it changed:

- Fact-stage Gemini remains the dominant batch latency cost.
- This trims prompt weight on the structured bulk path first, before taking on a riskier global model change.

Validation:

- `node --import tsx scripts/test-classifier.ts`
- `npm run docs:check`

---

## 2026-03-24 — Bulk rerun speedups for structured content (v29)

Policy version: `2026-03-24-enterprise-v24`

What changed:

- Added a governed policy list for content types that should skip dynamic few-shot retrieval during bulk runs.
- `pageCaseStudy` and `caseStudy` now skip dynamic few-shot retrieval by default in `scripts/classify-pillar-pages.ts`, while still allowing `--use-few-shot` to force it back on.
- Bulk runs can now reuse unchanged rows from the latest native export before any crawl or Gemini work starts.
- Batch reuse now reads classification history once per run instead of once per entry.

Previous behavior:

- Every bulk row paid the deep crawl + classify path even when the entry had not changed since the last recorded classification.
- Case-study bulk reruns still paid the dynamic few-shot retrieval overhead even though those pages are heavily structured and already policy-constrained.
- Reuse checks reread the history cache for every entry.

Why it changed:

- The bulk case-study path was dominated by repeated Gemini work and unnecessary retrieval overhead on reruns.
- These changes remove avoidable work first without changing the underlying taxonomy contract.

Validation:

- `node --import tsx scripts/test-classifier.ts`
- `npm run docs:check`

---

## 2026-03-24 — Concise per-field reasoning prompt (v28)

Policy version: `2026-03-24-chain-v5`

What changed:

- Bumped the default classifier prompt version to `2026-03-24-chain-v5`.
- Tightened subjective-stage reasoning instructions so the model must emit exactly one short line per field, in the listed order.
- Added hard brevity guidance: target 4-12 words, max 18 words after the tag.
- Explicitly prohibited intro paragraphs, closing summaries, and final-value dumps in the model-written reasoning.
- Added deterministic coverage checks in `scripts/test-classifier.ts` so prompt regressions fail verification.

Previous behavior:

- The prompt asked for one line per field, but was still loose enough for Gemini to return long mixed reasoning blocks.
- Reviewer exports often needed post-processing to separate AI rationale from lock text and snapshot noise.

Validation:

- `node --import tsx scripts/test-classifier.ts`

---

## 2026-03-23 — Batch classification strictness + webhook verification (v23)

Policy version: `2026-03-23-enterprise-v23`

What changed:

- `batchClassifyContent` no longer returns placeholder taxonomy on non-vendor errors; errors propagate so batch scripts do not silently write misleading labels.
- Contentful webhook verification uses `@contentful/node-apps-toolkit` `verifyRequest` (canonical request signing) instead of body-only HMAC; signing secret must be exactly 64 characters when verification is enabled.
- Cron handler accepts **GET** (Vercel scheduled crons) and **POST** (manual `curl`).

Validation: `npm run verify:classifier`

---

## 2026-03-19 — Sidebar Full Pipeline + CDA Crawler + Metadata Overrides (v4–v19)

Policy versions:
- `2026-03-18-enterprise-v4` through `2026-03-18-enterprise-v19`

What changed (cumulative):

**Sidebar pipeline (v4–v5)**
- Added `slug` extraction to deep crawl path — enables content signals, URL pattern detection
- Added `nameInternal` to title field candidates
- Switched sidebar from `interactive` to `default` execution mode — enables NLP, company enrichment, few-shot
- Copy report now outputs formatted plaintext instead of raw JSON

**Cron job fixes (v5)**
- Added `allowedLabels` to cron's `classifyContent` call — enables `pickTop` max enforcement
- Added `nameInternal` and `url` fallback for slug

**needsReview fix (v5)**
- Removed calibration data-backing gate from `needsReview` — was forcing review on every classification until 25+ entries reviewed. Now only triggers on actual low confidence (overall < 0.75 or weakest semantic < 0.6)
- Calibration progress shown as `[info]` advisory

**Sidebar taxonomy display (v5–v7)**
- Added Language, Usage Rights to classification table
- Removed `Global`, `EN`, `External` from DEFAULT_VALUES filter
- Added Competitive Mentions, Review Tier sections
- Added colored tag pills for reasoning ([LOCKED]/[SIGNAL]/[ENRICHMENT]/[METADATA]/[AI])

**Multi-select caps (v8)**
- Topic/useCases: 2→3 default, 3→4 for broad TOFU
- Audience: 2→3 for all content types
- `pickTop` no longer uses Jaccard closeness gating — keeps all AI values up to max

**Audience blank rule (v9)**
- Audience left empty when content doesn't specifically address any group

**Recommended actions removed (v10)**
- Removed from schema, sidebar display, and copy report

**Content quality thresholds (v10, reverted)**
- Briefly lowered, then reverted to original 400/1000

**CDA-first crawler (v11)**
- New `crawlViaCda()` function resolves all references in one API call (`include: 10`)
- Falls back to Management API `RecursiveContentCrawler` if CDA token unavailable

**Entry metadata as ground truth (v11–v13)**
- Extracts author-set metadata fields from Contentful entries (companySize, industries, useCases, etc.)
- Injects as labeled block in content for AI context
- Post-processing hard-overrides AI values with metadata at 99% confidence
- Now handles reference fields (taxonomy concepts with name/title)

**Parent page lookup (v12)**
- When sidebar opens on a child entry (caseStudy), finds parent page entry (pageCaseStudy) via `links_to_entry` and crawls from there

**Confidence cap (v14–v15)**
- All AI-inferred fields capped at 97% max (was 100% for FULL_BODY)
- Expanded from 6 semantic fields to all 14 AI fields

**Reasoning format (v16–v17)**
- Fixed: `SUBJECTIVE_RULES` said "top 3 in 2-4 sentences" — overrode every-field rule
- Now: one line per field, `fieldName: [TAG] value — why`
- Made `reasoning` non-optional in subjective schema
- Sidebar parses `fieldName: [TAG]` boundaries for display

**Funnel stage unlocked (v18)**
- Case studies: MOFU + BOFU (was BOFU-only)
- Blog/longFormSeo: added BOFU
- Resources: added TOFU, schema now AI-decides

**Case study enrichment (v19)**
- Company enrichment for case studies now only uses the featured customer (first mentioned company), not all brands on the page

Previous behavior:
- Sidebar used limited `interactive` execution mode, missing slug, nameInternal
- Cron job lacked `allowedLabels`, allowing unlimited multi-select values
- Every classification flagged as "needs review" due to calibration gate
- CDA not used for crawling — Management API batch-fetch missed references
- Entry metadata ignored — AI guessed values already set by content team
- Reasoning only covered top 3 fields

Validation:
- Live classification testing on multiple `pageCaseStudy` and `caseStudy` entries
- Sidebar classify, copy report, approve/publish workflow verified
- Vercel deployments confirmed live for each version

---

## 2026-03-18 — Interactive Execution Profile For Sidebar Classification

Policy version:
- `2026-03-18-enterprise-v1`

What changed:
- added an explicit `interactive` classifier execution profile for the sidebar request path
- interactive requests now use:
  - static allowed taxonomy labels
  - heuristic signals only, without the external NLP sidecar
  - cache-only company enrichment
  - no dynamic few-shot retrieval
- added stage timing logs for the interactive route and classifier runtime

Previous behavior:
- sidebar classification used the full runtime path synchronously:
  - org taxonomy label loading
  - external NLP enrichment
  - company lookup with live search
  - dynamic few-shot retrieval
  - chained model generation
- under Vercel serverless this could exceed the `300s` runtime limit and return `504`

New behavior:
- interactive sidebar classification keeps the real chained classifier and deep crawl flow
- optional enrichment steps that are useful for batch accuracy but too expensive for request-response interaction are disabled in the interactive profile
- Vercel logs now show timing by stage so slow phases can be identified directly

Why it changed:
- the sidebar path needs a bounded interactive SLA
- the failure mode in production was request timeout, not taxonomy correctness
- this preserves the real classifier while removing repeated synchronous network work from the request path

Validation:
- `npm run check`
- `npm run check:classifier-governance`
- updated evaluation fixture:
  - [golden-signal-fixtures.json](../../tests/golden-signal-fixtures.json)

---

## 2026-03-18 — Enterprise Governance Guardrails

Policy version:
- `2026-03-18-enterprise-v1`

What changed:
- added a versioned classifier policy module
- added a classifier-governance pre-commit hook
- required runtime classifier changes to travel with policy, docs, and evaluation/calibration artifacts

Previous behavior:
- classifier runtime logic could be changed directly in code without any automatic enforcement that docs, policy, or evaluation artifacts were updated alongside it

New behavior:
- runtime classifier changes are now guarded by:
  - [.githooks/pre-commit](../../.githooks/pre-commit)
  - [check-classifier-governance.mjs](../../scripts/check-classifier-governance.mjs)
- commits are blocked if classifier runtime files change without:
  - a policy/prompt/calibration asset change
  - a docs change
  - an evaluation/calibration artifact change

Why it changed:
- future classifier updates should follow an enterprise change-management standard instead of ad hoc logic edits
- reviewable policy and evaluation context should move with the code change

Validation:
- `npm run check`
- `npm run check:classifier-governance`
- `npm run hooks:install`

---

## 2026-03-18 — Confidence Must Be Data-Backed

Policy version:
- `2026-03-18-enterprise-v1`

What changed:
- confidence calibration now requires minimum reviewed sample sizes before it can override raw confidence
- the classifier now explicitly marks confidence as not data-backed when calibration evidence is insufficient
- review is forced when confidence is not yet data-backed
- CSV export now includes `Confidence Data-Backed` and `Review Reasons`

Previous behavior:
- the calibration profile had only `9` reviewed overlap examples
- because only the `0.8-1.0` overall band was populated, many high-confidence pages were flattened to `0.8889`
- this created repeated `89%` scores that looked more precise than the data justified

New behavior:
- field-level and overall calibration only apply when minimum sample thresholds are met
- low-sample calibration no longer collapses many different pages into the same `89%` confidence bucket
- if calibration is enabled but underpowered, the output clearly states that confidence is not data-backed yet

Why it changed:
- confidence should mean something statistically, not just look neat in exports
- if the reviewed overlap set is too small, the system should be honest and conservative

Validation:
- `npm run check`
- live Vertex run on `pageCaseStudy` entry `4XxTAZbyzZGBWDFWINPVHJ`
- export:
  - [pageCaseStudy-taxonomy-2026-03-18T16-16-05.csv](../../exports/pageCaseStudy-taxonomy-2026-03-18T16-16-05.csv)

---

## 2026-03-18 — Multi-Select Preservation + Internal Title Cleanup

Policy version:
- `2026-03-18-enterprise-v1`

What changed:
- multi-select fields now preserve more valid values instead of collapsing too early
- internal-only title annotations are removed before classification and export display

Previous behavior:
- post-processing narrowed some fields too aggressively:
  - `jobLevel` was effectively reduced too tightly
  - `jobFunction` and `audience` were narrower than Bulent’s guidance allowed
  - URL audience hints could overwrite the model output down to a single value
- internal markers such as `(churned)` or `[replaced with translated version]` could leak into classification input

New behavior:
- `audience` supports up to `3` values for blog-like content
- `jobLevel` supports up to `3` values where genuinely applicable
- `jobFunction` supports up to `3` values where genuinely applicable
- `product` can preserve a second genuinely central product
- URL audience hints merge in as a floor instead of replacing the whole field
- internal title markers are stripped before signal extraction, prompting, and CSV titles

Why it changed:
- Bulent explicitly said blog content can have up to `3` audiences
- multi-select fields should preserve genuinely applicable values instead of being narrowed by implementation artifacts
- internal editorial notes should not distort taxonomy classification

Validation:
- `npm run check`
- live rerun started on first `5` case studies with cleaned titles visible in crawl output
