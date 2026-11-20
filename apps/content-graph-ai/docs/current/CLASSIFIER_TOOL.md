# AI Taxonomy Classifier — Tool Logic & Architecture

> Last updated: 2026-03-24
> This document is a lower-level tool reference. The authoritative live runtime spec is `docs/current/CLASSIFIER_LOGIC.md`.

## What It Does

Classifies Contentful CMS pages against a 16-field taxonomy using a 4-layer pipeline. The same core classifier is used by the sidebar/API and queue worker; batch scripts can additionally emit CSVs for offline review.

**Run it:**
```bash
npx tsx scripts/classify-pillar-pages.ts                        # default 7 SEO pillars
npx tsx scripts/classify-pillar-pages.ts --ids id1,id2,id3     # specific entries
npx tsx scripts/classify-pillar-pages.ts --tag productPillars   # by Contentful tag
npx tsx scripts/classify-pillar-pages.ts --content-type pageCaseStudy --limit 200
npx tsx scripts/classify-pillar-pages.ts --crawl-concurrency 2 --classify-concurrency 6
npx tsx scripts/classify-pillar-pages.ts --content-type pageCaseStudy --fact-content-limit 1200
npx tsx scripts/classify-pillar-pages.ts --content-type pageCaseStudy --use-few-shot
```

---

## Pipeline Overview

```
Contentful Entry
      │
      ▼
┌─────────────────────────────────┐
│  LAYER 0 — Content Extraction   │  recursiveCrawler.ts + CDA
│  Pull full page text via CDA    │  classify-pillar-pages.ts
│  Field-aware, noise-filtered    │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  LAYER 1 — Signal Extraction    │  contentSignals.ts
│  Deterministic pre-AI signals   │
│  URL · CTA · product · language │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  LAYER 2 — Company Enrichment   │  companyCache.ts
│  Brand logos → buyer industry   │
│  Seed data · file cache · AI    │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  LAYER 3 — AI Classification    │  classificationTool.ts
│  Gemini generateObject          │
│  Structured 4-section prompt    │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  LAYER 4 — Post-Processing      │  classificationTool.ts
│  Tier 1: Content type profile   │
│  Tier 2: Signal overrides       │
│  Tier 3: Feedback corrections   │
└──────────────┬──────────────────┘
               │
               ▼
         Contentful writeback / API response / CSV / traces
```

---

## Layer 0 — Content Extraction

**Files:** `scripts/classify-pillar-pages.ts`, `api/_shared/utils/recursiveCrawler.ts`

### How it crawls

Uses the Contentful **Delivery API** (CDA) with `include: 10` to resolve the full linked-entry tree in a single request. Falls back to the Management API (CMA) batch fetcher if CDA fails per entry.

```
CDA → getEntry(id, { include: 10 })  ← full tree, one request, no rate limits
  └─ fails → CMA batch getEntries({ sys.id[in]: [...] })
```

### Persistent CDA token

Stored as `CONTENTFUL_CDA_TOKEN` in `.env.production.local`. Reused across runs to avoid unnecessary setup overhead and rate-limit issues.

### Bulk rerun shortcuts

The batch script now avoids work in two places:

- unchanged rows can be copied forward from the latest native export before crawl/classify
- `pageCaseStudy` and `caseStudy` bulk runs skip dynamic few-shot retrieval by default

Overrides:

- `--no-reuse-unchanged`
- `--skip-few-shot`
- `--use-few-shot`
- `--fact-content-limit`

### Field-aware extraction

Fields are split into priority tiers before being sent to the AI:

| Priority | Field pattern | Output |
|----------|--------------|--------|
| High | `seo`, `meta`, `description`, `title`, `headline` | Labeled `[fieldName]: value` — appears first |
| Normal | All other fields | Raw value — appears after high-priority |
| Skipped | `ai*`, `slug`, `url`, `canonical`, `noIndex`, `jsonLd` | Dropped entirely |

### Noise filtering

Known structural content types are skipped at depth > 0 (not at root):

```
navigationMenu · navigation · navMenu · footer · footerMenu
headerMenu · megaMenu · siteNav · globalNav · cookieBanner
legalPage · relatedContent · relatedArticles · cardGrid
```

### Contentful tags

`metadata.tags` are extracted from each entry and prepended as:
```
CONTENTFUL TAGS: productPillars, someOtherTag
```

This gives the AI direct access to human-authored classification signals.

### Deduplication

Repeated text (caused by Ninetailed personalization variants) is collapsed before the 20,000-char limit is applied. Prevents Gemini MAX_TOKENS loops.

---

## Layer 1 — Signal Extraction

**File:** `api/_shared/utils/contentSignals.ts`

Deterministic facts extracted from URL, title, and text — before any AI call. These signals are injected into the prompt and used for post-processing overrides.

### URL pattern matching

Patterns are matched against path segments (not substrings). A bare-word pattern like `/platform` requires `platform` to be an exact URL segment — preventing `guides/personalization` from matching `/personalization`.

| Pattern | Matches | Example |
|---------|---------|---------|
| `product` | `/products/`, `/platform`, `/studio`, `/ai-actions`, `/ecosystem`, `/analytics`, `/hosting`, `/features/` | `/products/platform` |
| `blog` | `/blog/`, `/articles/`, `/posts/` | `/blog/headless-cms` |
| `resource` | `/resources/`, `/ebooks/`, `/whitepapers/`, `/reports/` | `/resources/ebook` |
| `event` | `/events/`, `/webinars/`, `/conferences/` | `/events/webinar` |
| `caseStudy` | `/customers/`, `/case-studies/` | `/customers/nike` |
| `docs` | `/docs/`, `/developers/`, `/api/` | `/docs/getting-started` |
| `pricing` | `/pricing/` | `/pricing` |

### CTA detection (hasDemo / hasPricing)

Only counts as primary intent if:
1. The phrase appears in the **middle 70% of the body** (excludes top 15% nav and bottom 15% footer)
2. Appears **≤ 2 times** total (nav/footer repetition typically produces 3+)

This prevents global nav "Request a Demo" from forcing every page to BOFU.

### HowTo detection (hasStepByStep)

Requires an instructional verb after a step number:
```
step 1: install / configure / set up / create / deploy / build / run / connect...
```
Plain numbered lists like `1. Benefits of headless CMS` do **not** trigger this.

### Product detection

Requires Contentful brand context — not bare keyword matching:

| Allowed | Not allowed |
|---------|------------|
| `Contentful Studio` | `studio` (alone) |
| `Contentful Personalization` | `personalization` (alone) |
| `Ninetailed` | `personalization` (alone) |
| `AI Actions` | `AI` (alone) |

### Video / Download detection

| Signal | Requires |
|--------|---------|
| `hasVideo` | Embed URL (vimeo/youtube/wistia/loom), or "watch the demo/video", or event/webinar page |
| `hasDownload` | Explicit download CTA ("download the ebook", "get the free guide", `.pdf` link) |

Word presence alone ("video", "guide") does not trigger either.

### Usage rights

Flags `Internal` only for explicit distribution restrictions:
```
internal only · for internal use · confidential · do not share
not for distribution · internal use only
```
`restricted` alone does **not** trigger (too common in API/technical content).

### Body summary

- Line filter: drops lines under **15 chars**
- Max signal-summary length: **4,000 chars**
- The subjective stage uses an even smaller compressed excerpt to keep latency bounded

### Hard overrides produced by Layer 1

| Field | Condition | Value |
|-------|-----------|-------|
| `schemaType` | URL is product page | `SoftwareApplication` |
| `schemaType` | URL is blog | `BlogPosting` |
| `schemaType` | URL is event | `Event` |
| `schemaType` | URL is docs | `TechArticle` |
| `schemaType` | URL is case study | `Article` |
| `schemaType` | hasFAQ | `FAQPage` |
| `schemaType` | hasStepByStep (instructional) | `HowTo` |
| `assetSubType` | URL is blog | `Blog` |
| `assetSubType` | URL is case study | `Case Study` |
| `assetSubType` | URL is event | `Event` |
| `assetSubType` | URL is docs | `Documentation` |
| `assetSubType` | URL is product | `Product` |
| `funnelStage` | hasDemo OR hasPricing (scoped) | `Evaluation/Engagement (BOFU)` |
| `funnelStage` | URL is docs | `Retention` |
| `language` | FR/DE word frequency | `FR` or `DE` |
| `usageRights` | Internal phrase detected | `Internal` |

---

## Layer 2 — Company Enrichment

**File:** `api/_shared/utils/companyCache.ts`

Resolves mentioned brand logos to industry and company size — to inform who buys this product, not what industry the page is about.

### Resolution order

```
1. Seed data (~30 known brands, instant, no API)
2. In-memory Map cache (per process)
3. File cache (.cache/company-taxonomy.json, 30-day TTL)
4. Gemini search grounding (default `gemini-3.0-flash`)
```

### Suppression

Company enrichment is **suppressed** for content types where brand logos are customer examples, not buyer signals (e.g., `pageLongFormSeo`, `pageGlossary`). Set via `companyEnrichmentApplies: false` in the content type profile.

---

## Layer 3 — AI Classification

**File:** `api/_shared/tools/classificationTool.ts`
**Models:** fact stage defaults to `gemini-3.1-pro-preview`; subjective stage defaults to `gemini-2.5-flash-lite`

### Prompt structure

```
SECTION 0 — Content Type + Profile (new)
  Content type as ground truth. Locked fields declared here.
  Schema type decision tree.

SECTION 1 — Pre-computed Signals (ground truth)
  URL pattern, CTA signals, product mentions, company enrichment,
  season, year, region, language. Inferred overrides flagged as [LOCKED].

SECTION 2 — Company Enrichment
  Brand → industry/size lookup results. Derived recommendation.

SECTION 3 — Structured Content
  SEO meta description (labeled), page title, primary CTAs,
  feature headings, bounded body excerpt.

SECTION 4 — Allowed Taxonomy Values
  Exact allowed values for each field from the Bynder taxonomy workbook.

SECTION 5 — Few-shot corrections (when available)
  Dynamically selected human-corrected examples retrieved from the correction store.
```

### Schema type decision tree (in prompt)

Applied in order, first match wins:

1. `pageLongFormSeo` broad educational guide → `Article`
2. `pageLongFormSeo` developer implementation or reference content → `TechArticle`
3. `pageBlogPost` → `BlogPosting`
4. `pageCaseStudy` → `Article`
5. `pageEvent` → `Event`
6. `pagePricing` → `SoftwareApplication`
7. URL `/products/` or `/features/` → `SoftwareApplication`
8. URL `/blog/` → `BlogPosting`
9. URL `/customers/` → `Article`
10. hasFAQ as primary structure → `FAQPage`
11. Step-by-step procedural with actionable verbs → `HowTo`
12. Primary content is downloadable → `DigitalDocument`
13. Default → `Article`

### Chain-of-thought enforcement

AI is instructed to process signals first (Section 1 → 2), then reason semantically (Section 3), then select from allowed values (Section 4). Prevents the AI from ignoring deterministic signals.

---

## Layer 4 — Post-Processing

**File:** `api/_shared/tools/classificationTool.ts`

Three tiers applied in order after the AI call:

### Tier 1 — Content type profile (highest priority, always wins)

**File:** `config/content-type-profiles.json` (also inlined in classificationTool.ts)

Deterministic profiles for 20 content types. Each profile defines:

| Field | Behaviour |
|-------|-----------|
| `assetType` | Always overwritten if profile defines it |
| `assetSubType` | Always overwritten if profile defines it |
| `schemaType.default` | Applied when `aiDecides: false` (locked) or when AI picks a `never` value |
| `schemaType.never` | List of schema values forbidden for this content type — gates both AI output and signal overrides |
| `funnelStage.never` | Forbidden funnel stages — AI output reset to `default` if violated |
| `companyEnrichmentApplies` | `false` = skip Layer 2 for this content type |

**Key profiles:**

| Content Type | Sub-Type | Schema | Funnel Default | Funnel Never |
|-------------|----------|--------|---------------|-------------|
| `pageLongFormSeo` | Article | AI picks (Article by default, TechArticle only for implementation/reference pages) | TOFU | BOFU, HowTo, SoftwareApplication |
| `pageBlogPost` | Blog | BlogPosting (locked) | TOFU | BOFU |
| `pageCaseStudy` | Case Study | Article (locked) | MOFU | TOFU |
| `pageResource` | AI picks | DigitalDocument (locked) | MOFU | TOFU |
| `pageEvent` | Event | Event (locked) | MOFU | — |
| `pagePricing` | Webpage | SoftwareApplication (locked) | BOFU | TOFU, MOFU |
| `page` | null (URL decides) | null (URL decides) | — | — |

### Tier 2 — Signal overrides

URL and content signals override AI output for fields where signals are unambiguous ground truth (language, usageRights, schemaType for known URL patterns). Signal overrides **respect the content type profile's never-list** — a signal cannot re-apply a forbidden schema after the profile has rejected it.

### Tier 3 — Feedback corrections

Human corrections from `.cache/feedback-corrections.json` (runtime) and `seeds/feedback-corrections.json` (committed baseline) are applied last for the matching entry and can override final field values.

---

## Learning Loop

```
Run classifier
     │
     ├─ classificationHistory.ts ──► .cache/classification-history.json
     │  Compares to previous run. Reports drift (⚠️ regression / ℹ️ change).
     │
     └─ feedbackStore.ts ──────────► .cache/feedback-corrections.json
        Human edits this file with correct values.
        Applied at Tier 3 for matching entries. Relevant reviewed
        examples can also be retrieved dynamically as few-shot context.
```

### Two-layer feedback store

| Layer | File | Purpose |
|-------|------|---------|
| Committed baseline | `seeds/feedback-corrections.json` | Version-controlled. New environments get verified corrections on first run. |
| Runtime overlay | `.cache/feedback-corrections.json` | Gitignored. Local overrides. Wins on conflict. |

---

## Output

### Batch CSV columns

`Entry ID · Title · Content Type · URL/Slug · Asset Type · Asset Sub-Type · Schema Type · Product · Job Level · Job Function · Audience · Topic · Use Cases · Funnel Stage · Industry · Company Size · Region · Language · Usage Rights · Event · Season · Year Published · Overall Confidence · Needs Review · AI Reasoning · Competitive Mentions · Recommended Actions · Classified At · Model`

### Confidence thresholds

| State | Threshold |
|-------|-----------|
| `Needs Review: YES` | Overall confidence < 0.75, weakest semantic field < 0.60, or policy escalation |
| Feedback correction applied | Confidence set to 0.99 |
| Profile locked field | Confidence set to 0.99 |
| Profile never-list reset | Confidence set to 0.85–0.87 |

---

## Key Files

| File | Purpose |
|------|---------|
| `scripts/classify-pillar-pages.ts` | Batch entry point, crawl + classify + CSV output |
| `api/_shared/tools/classificationTool.ts` | AI classification, prompt, post-processing |
| `api/_shared/utils/contentSignals.ts` | Layer 1 deterministic signal extraction |
| `api/_shared/utils/companyCache.ts` | Layer 2 company enrichment |
| `api/_shared/utils/recursiveCrawler.ts` | CMA fallback crawler (batch fetching) |
| `api/_shared/utils/classificationHistory.ts` | Drift detection |
| `api/_shared/utils/feedbackStore.ts` | Human correction store + few-shot builder |
| `config/content-type-profiles.json` | Content type profile definitions |
| `seeds/feedback-corrections.json` | Committed correction baseline |
| `.cache/feedback-corrections.json` | Runtime corrections (gitignored) |
| `.cache/classification-history.json` | Run history for drift detection (gitignored) |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `CONTENTFUL_SPACE_ID` | Target Contentful space |
| `CONTENTFUL_MANAGEMENT_TOKEN` | CMA token for entry fetching |
| `CONTENTFUL_CDA_TOKEN` | Persistent delivery token (reused every run) |
| `CONTENTFUL_ENV_ID` | Contentful environment (default: master) |
| `GEMINI_FACT_MODEL` | Fact-stage model (default: gemini-3.1-pro-preview) |
| `GEMINI_SUBJECTIVE_MODEL` | Subjective-stage model (default: gemini-2.5-flash-lite) |
| `GEMINI_SEARCH_MODEL` | Company lookup model (default: gemini-3.0-flash) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key |
