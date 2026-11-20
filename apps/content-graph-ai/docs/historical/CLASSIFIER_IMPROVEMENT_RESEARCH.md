# Classifier Intelligence Research Report

> Historical research artifact. Use `docs/current/CLASSIFIER_LOGIC.md` for the current runtime contract.

> Generated: 2026-03-05 (YOLO research session)
> Updated: 2026-03-06 (3-tier review, cache fixes, judge hardening, corrections cleanup)
> Scope: Full pipeline review + state-of-the-art literature synthesis
> Status: ALL IMPLEMENTED — see "Implementation Status" section below

---

## Implementation Status (2026-03-05)

| # | Improvement | File | Status |
|---|-------------|------|--------|
| 1 | Embedding utility with file cache | `api/_shared/utils/embeddingCache.ts` (NEW) | ✅ Done |
| 2 | Semantic few-shot selection | `api/_shared/utils/feedbackStore.ts` | ✅ Done |
| 3 | Expanded company regex (175+ brands) | `api/_shared/utils/contentSignals.ts` | ✅ Done |
| 4 | URL pattern: trailing slash fix | `api/_shared/utils/contentSignals.ts` | ✅ Done (bug found by tests) |
| 5 | Consistency warnings (7 cross-field rules) | `api/_shared/tools/classificationTool.ts` | ✅ Done |
| 6 | Content-to-content graph edges | `api/_shared/graph/pgGraph.ts` | ✅ Done |
| 7 | `getRelatedContent()` + `getContentGaps()` | `api/_shared/graph/pgGraph.ts` | ✅ Done |
| 8 | Regression test suite (7 fixtures, 0 Gemini) | `scripts/test-classifier.ts` (NEW) | ✅ Done — 7/7 passing |
| 9 | `--force` flag for testing | `scripts/classify-pillar-pages.ts` | ✅ Done |
| 10 | Graph wiring post-classification | `scripts/classify-pillar-pages.ts` | ✅ Done |
| 11 | Content-hash caching | `api/_shared/tools/classificationTool.ts`, `api/_shared/utils/classificationHistory.ts`, `scripts/classify-pillar-pages.ts` | ✅ Done (2026-03-06) |
| 12 | 3-tier Review Tier system (READY/SPOT-CHECK/REVIEW) | `scripts/classify-pillar-pages.ts` | ✅ Done (2026-03-06) — replaces binary needsReview in CSV |
| 13 | Judge taxonomy validation guard + prompt constraints | `scripts/judge-classifications.ts` | ✅ Done (2026-03-06) — prevents invalid values being promoted |
| 14 | Corrections store cleanup + bad judge correction removal | `.cache/feedback-corrections.json` | ✅ Done (2026-03-06) — 98% field accuracy, 9 clean corrections |
| 15 | Confidence scale normalization (0-1 vs 0-100 in cache path) | `api/_shared/tools/classificationTool.ts` | ✅ Done (2026-03-06) — fixed 5606% display bug |
| — | Consistency sampling | — | SKIPPED — temp=0 makes it useless |

**Adversarial note:** The test suite itself caught a pre-existing URL matching bug (trailing slash required on `/pricing` slug). Fixed in contentSignals.ts.

---

## Executive Summary

The current 4-layer classifier (contentSignals → companyCache → Gemini AI → post-processing) is well-architected but has six systemic weaknesses that limit its ceiling:

1. **Few-shot selection is recency-biased, not semantically relevant** — you get the 5 most recent corrections, not the 5 most similar to the current page
2. **AI confidence scores are poorly calibrated** — self-reported confidence doesn't reliably predict accuracy; high-confidence hard overrides (0.99) mask uncertainty in semantic fields
3. **Confidence is still model-reported, not calibrated to real accuracy** — review tiering helps operationally, but self-reported confidence remains an imperfect signal
4. **Feedback generalizes to nothing** — a correction for Page A teaches nothing about semantically similar Page B
5. **Field dependencies aren't validated** — classifier can output contradictory combinations (e.g., funnelStage=Retention + audience=Prospect)
6. **43 open taxonomy questions** create systematic AI confusion in ambiguous edge cases

Below: tiered recommendations from immediate wins (no model changes, < 1 day) to architectural improvements (multi-week). Items marked done above have already been integrated into the current pipeline.

---

## Tier 1 — Immediate Wins (< 1 day, high impact)

### 1.1 Content Hashing for Classification Caching

Status: Implemented on 2026-03-05 via `contentHash` history storage plus cache lookup in `classificationTool.ts`.

**Problem:** Every run re-classifies every page, even if nothing changed. At 45–90s per page on Gemini 3.1 Pro, this is expensive and introduces unnecessary variance.

**Solution:** SHA-256 hash of (title + bodySummary + slug). If hash matches last run in classification-history.json, return cached result without calling Gemini.

**Implementation sketch:**

```typescript
// In classificationTool.ts, before calling generateObject:
import { createHash } from 'crypto';

const contentHash = createHash('sha256')
  .update(slug + title + bodySummary)
  .digest('hex');

const lastHistory = getLastClassification(entryId);
if (lastHistory?.contentHash === contentHash && !forceReclassify) {
  console.log(`  ⚡ Cache hit for ${entryId} — content unchanged`);
  return { ...lastHistory.result, cached: true };
}

// Add contentHash to HistoryEntry type and persist it
```

**Expected impact:** 80–95% of pages can skip Gemini on repeat runs. Classification scripts go from 45–90s/page to <1s for cached pages.

---

### 1.2 `needsReview` Based on Weakest Semantic Field (Not Average)

**Problem (documented in adversarial analysis):** `needsReview` averages all field confidences. Hard overrides (Language=0.99, UsageRights=0.99) inflate the average, hiding low-confidence semantic fields like Topic (0.55) or UseCase (0.60).

**Current behavior:** A page with Topic=0.55 and Language=0.99 gets average ~0.77 → no review flag.

**Fix:** Use the minimum confidence of semantic fields only: `['topic', 'useCases', 'jobLevel', 'jobFunction', 'funnelStage', 'industry']`

```typescript
const SEMANTIC_CONFIDENCE_FIELDS = [
  'topic', 'useCases', 'jobLevel', 'jobFunction', 'funnelStage', 'industry'
];

const semanticConfidences = SEMANTIC_CONFIDENCE_FIELDS
  .map(f => result[f]?.confidence ?? 0)
  .filter(c => c > 0);

const minSemanticConfidence = Math.min(...semanticConfidences);
const needsReview = minSemanticConfidence < 0.70; // flag if any semantic field uncertain
```

**Expected impact:** Surfaces pages where AI is genuinely uncertain, reduces false confidence.

---

### 1.3 Field Dependency Validation in Post-Processing

**Problem:** No validation that field combinations make sense together. The AI can produce valid individual fields that are contradictory in combination.

**Known contradictions to enforce:**

| Rule | Constraint |
|------|-----------|
| funnelStage=Retention → audience | Must include "Direct Customer" |
| funnelStage=Awareness (TOFU) → audience | Cannot be "Direct Customer" only (TOFU is prospect-facing) |
| assetType=Video → schemaType | Must be "VideoObject" or "Event", never "Article" |
| assetType=Audio → schemaType | Must be "PodcastEpisode" |
| urlPattern=caseStudy → funnelStage | Must not be TOFU |
| contentType=caseStudy/pageCaseStudy → funnelStage | Govern as Consideration (MOFU) |
| product=[] (no product) + schemaType=SoftwareApplication | Suspicious — flag for review |
| jobLevel and funnelStage | Review only when page evidence contradicts the combination; do not infer one field from the other |

**Implementation:** Add a `validateFieldConsistency(result, signals)` function in post-processing Layer 4. Return `consistencyWarnings: string[]` alongside the result for logging and CSV export.

---

### 1.4 Expand KNOWN_COMPANY_REGEX with Case-Insensitive Flag

**Problem:** `KNOWN_COMPANY_REGEX` in `contentSignals.ts` uses the `gi` flag but the list of ~50 companies is far too short. Many B2B enterprise customers aren't covered.

**Fix:** Expand to ~200 companies. Priority additions for Contentful's customer base:

```
Financial: American Express, JPMorgan Chase, Barclays, ING, Allianz, Zurich
Retail: Carrefour, Marks & Spencer, Zalando, Otto Group, Levi's, Saks
Media: BBC, Sky, Financial Times, The Guardian, Hearst, Condé Nast, Axel Springer
SaaS/Tech: Twilio, PagerDuty, Datadog, Snowflake, Databricks, HashiCorp
Healthcare: Siemens Healthineers, Roche, Pfizer, Johnson & Johnson
Automotive: Ford, GM, Tesla, Stellantis, Jaguar Land Rover
Travel: Marriott, Hilton, Booking.com, Expedia, Delta, Lufthansa
```

This directly improves case study industry classification (the one content type where company enrichment is authoritative).

---

## Tier 2 — Architecture Improvements (1–3 days, high impact)

### 2.1 Semantic Few-Shot Selection via Embedding Similarity

**Current behavior:** `feedbackStore.ts` injects the 5 most recently corrected entries as few-shot examples. These may be completely different content types and topics from the page being classified.

**Problem (from research):** "Retrieval-style in-context learning" — using semantically similar examples rather than random/recent — consistently outperforms recency-based selection for classification tasks. Retrieval-style ICL paper (MIT Press/TACL 2024) shows 15–20% accuracy improvement over random selection.

**Proposed approach:** Embed feedback corrections at save time. At classification time, embed the page's bodySummary. Use cosine similarity to select the top-K most similar corrections as few-shot examples.

**Implementation:**

```typescript
// feedbackStore.ts additions:

interface Correction {
  // ... existing fields ...
  embedding?: number[]; // text-embedding-004 or similar, 768-dim
}

// At save time:
export async function saveCorrection(correction: Correction): Promise<void> {
  const text = `${correction.title} ${correction.fields.assetSubType ?? ''} ${
    (correction.fields.topic ?? []).join(' ')} ${correction.url}`;
  correction.embedding = await embedText(text); // Gemini text-embedding-004
  // ... existing save logic
}

// At retrieval time, replace time-sort with similarity:
export function buildFewShotBlock(queryEmbedding?: number[]): string {
  const store = loadStore();
  let entries = Object.values(store);

  if (queryEmbedding && entries.some(e => e.embedding)) {
    entries = entries
      .filter(e => e.embedding)
      .map(e => ({
        ...e,
        similarity: cosineSim(queryEmbedding, e.embedding!)
      }))
      .sort((a, b) => b.similarity - a.similarity);
  } else {
    entries = entries.sort((a, b) =>
      new Date(b.correctedAt).getTime() - new Date(a.correctedAt).getTime()
    );
  }

  return formatFewShot(entries.slice(0, MAX_FEW_SHOT));
}
```

**Gemini embedding model:** `text-embedding-004` via `@google/generative-ai`. 768-dim, free tier, <1ms for small text. Cache embeddings alongside corrections — only compute once.

**Expected impact:** More contextually relevant examples → better generalization from human corrections. Especially useful for edge cases where page content is unusual.

---

### 2.2 Classification Consistency Sampling for Uncertain Fields

**Problem (from research):** LLM self-verbalized confidence scores are poorly calibrated. A model can output confidence=0.85 for Topic when it's actually guessing. The STED framework (OpenReview 2025) and "Cycles of Thought" paper show that sampling multiple explanations and measuring variance is more reliable than self-reported confidence.

**Proposed approach:** For fields where the AI returns confidence < 0.70, run a focused second pass asking the model to justify its choice and explore alternatives. If the second pass agrees → confidence is real. If it disagrees → flag as genuinely uncertain.

**Lightweight version (single extra API call):**

```typescript
// In classificationTool.ts, after main classification:
const uncertainFields = SEMANTIC_CONFIDENCE_FIELDS
  .filter(f => result[f]?.confidence < 0.70);

if (uncertainFields.length > 0) {
  // Ask for focused reasoning on just uncertain fields
  const verificationPrompt = buildVerificationPrompt(result, uncertainFields, signals);
  const verification = await generateObject({ model, prompt: verificationPrompt, schema: UncertainFieldsSchema });

  // If verification agrees, boost confidence slightly (it's not a fluke)
  // If verification disagrees, keep lower confidence and add to warnings
  for (const field of uncertainFields) {
    if (verification[field]?.value === result[field]?.value) {
      result[field].confidence = Math.min(result[field].confidence + 0.10, 0.85);
    } else {
      result[field].confidence = Math.max(result[field].confidence - 0.10, 0.30);
      result.consistencyWarnings.push(`${field}: AI disagreed with itself on second pass`);
    }
  }
}
```

**Cost:** ~30% more API calls for pages with uncertain fields. Only triggers when < 0.70 confidence — in practice, fully-locked pages (high corrections coverage) never trigger this.

---

### 2.3 Taxonomy Label Embedding for Output Coercion

**Current behavior:** After AI classification, field values are coerced to exact taxonomy strings via string matching. If AI outputs "Blogs" instead of "Blog", the coercion either maps it or drops it.

**Problem:** String coercion misses near-misses where the AI is essentially correct but uses a synonym. More importantly, it doesn't leverage the semantic structure of the taxonomy itself.

**Proposed approach (TELEClass-inspired):** Pre-compute embeddings for all allowed taxonomy values at startup. For each AI output value, compute cosine similarity to all allowed values. Use nearest-neighbor match instead of exact string match.

```typescript
// taxonomy-embeddings.ts (generate once, cache to file)
const TAXONOMY_EMBEDDINGS: Record<string, Record<string, number[]>> = {};

// At startup (or from cached JSON):
for (const [field, values] of Object.entries(ALLOWED_TAXONOMY)) {
  TAXONOMY_EMBEDDINGS[field] = {};
  for (const value of values) {
    TAXONOMY_EMBEDDINGS[field][value] = await embedText(value);
  }
}

// During coercion:
function coerceToTaxonomy(field: string, aiValue: string): string | null {
  const fieldEmbeddings = TAXONOMY_EMBEDDINGS[field];
  if (!fieldEmbeddings) return null;

  // Try exact match first (fast path)
  if (aiValue in fieldEmbeddings) return aiValue;

  // Embed the AI output and find nearest neighbor
  const aiEmbedding = await embedText(aiValue);
  let bestMatch = '';
  let bestScore = 0;
  for (const [canonicalValue, embedding] of Object.entries(fieldEmbeddings)) {
    const score = cosineSim(aiEmbedding, embedding);
    if (score > bestScore) { bestScore = score; bestMatch = canonicalValue; }
  }

  // Only accept if similarity is high enough (avoids false coercions)
  return bestScore > 0.82 ? bestMatch : null;
}
```

**Expected impact:** Catches synonyms and near-misses. "Tech & IT" → "Information Technology / Security". "Demand Generation" → "Marketing". Reduces null fields from AI drift.

---

### 2.4 Content-Type-Aware Field Priority in Prompt Structure

**Current behavior:** All 16 fields are presented to the AI simultaneously in a flat list. For a case study, the AI still has to reason about all 16 fields despite 8 being locked.

**Proposed improvement:** Restructure the prompt so the AI only focuses on AI-decided fields for the given content type. Present locked fields as "already determined" context, not as tasks.

```
ALREADY DETERMINED (do not change):
- Asset Type: Document
- Asset Sub-Type: Case Study [LOCKED]
- Schema Type: Article [LOCKED]
- Funnel Stage: BOFU [LOCKED]

YOUR TASK — classify these 8 fields:
1. Product (0–2 values)...
2. Job Level (1–2 values)...
```

**Why this helps:** Research on multi-label classification shows that presenting fewer labels simultaneously improves per-label accuracy. Cognitive load reduction for the model — it can focus on the genuinely ambiguous fields without being distracted by already-solved ones.

---

## Tier 3 — Intelligence Layer (1–2 weeks, high ceiling)

### 3.1 Generalization from Corrections: Correction-to-Rule Learning

**Current behavior:** A correction for Entry A (Platform pillar page) applies only to Entry A. If Entry B (also a Platform pillar page) is classified, it gets no benefit from the correction — unless you manually copy corrections for each entry.

**Research backing:** Active learning with LLMs (ACL 2025 survey) shows that human corrections can be used to generate generalized rules, not just per-instance overrides.

**Proposed approach:** After saving a correction, ask Gemini to synthesize a generalizable rule from the correction:

```typescript
// In feedbackStore.ts, after saveCorrection():
async function synthesizeRule(correction: Correction): Promise<GeneralRule | null> {
  const prompt = `
A human corrected a content classification:
- Page: "${correction.title}" (${correction.url})
- Content Type: ${correction.contentType}
- Fields corrected: ${JSON.stringify(correction.fields)}
- Reason: "${correction.notes}"

Generate a generalized rule that should apply to similar pages.
Format: { "condition": "...", "fieldRules": {...}, "confidence": 0.XX }
`;
  const rule = await generateObject({ model: 'gemini-3.1-flash', prompt, schema: GeneralRuleSchema });
  return rule;
}

// Synthesized rules are stored in seeds/classifier-rules.json
// and injected into the prompt as a "LEARNED RULES" section
```

**Example output:** `"If URL matches /products/* AND content type is pageLongFormSeo, THEN industry=Software IT & Technology, jobLevel=[IC, Manager, Director]"`

This is how the feedback system graduates from per-page corrections to a general knowledge base.

---

### 3.2 Cross-Entry Learning: Similar-Page Batching

**Current behavior:** Each page is classified independently. A blog post about "Headless CMS" and a blog post about "Headless architecture" are classified with no awareness of each other.

**Proposed approach:** Before classification, cluster the batch by embedding similarity. Pages in the same cluster get each other's high-confidence classifications as additional few-shot context.

```typescript
// In classify-pillar-pages.ts or a new batch-classifier:
const embeddings = await Promise.all(pages.map(p => embedText(p.title + ' ' + p.bodySummary)));
const clusters = kMeansClusters(embeddings, k=Math.ceil(pages.length / 5));

// For each page, inject the highest-confidence neighbor as a within-batch example
for (const [pageIdx, page] of pages.entries()) {
  const cluster = clusters[pageIdx];
  const bestNeighbor = cluster.members
    .filter(m => m !== pageIdx)
    .sort((a, b) => pages[b].confidence - pages[a].confidence)[0];

  if (bestNeighbor) {
    pageContext[pageIdx].batchExample = formatBatchExample(pages[bestNeighbor]);
  }
}
```

---

### 3.3 Taxonomy Contradiction Resolver

**Problem:** 12 open questions about the taxonomy create systematic confusion (documented in CLASSIFIER_LOGIC.md). The AI is asked to classify against definitions that are internally contradictory (e.g., case study funnel stage: "BOFU" in profile vs "MOFU" in definition).

**Proposed approach:** Create a `taxonomy-conflicts.json` file that explicitly documents how contradictions should be resolved pending content team answer. The classifier uses this as a tiebreaker prompt section.

```json
// config/taxonomy-conflicts.json
{
  "pageCaseStudy.funnelStage": {
    "conflict": "Profile says BOFU, taxonomy definition says MOFU",
    "interim_rule": "Use BOFU — case studies are primarily proof points for late-stage buyers",
    "pending_answer": true,
    "confidence_cap": 0.75
  },
  "topic.omnichannel_vs_digital_experiences": {
    "conflict": "Digital experiences vs Omnichannel use case are near-identical",
    "interim_rule": "Use 'Digital experiences' for multi-channel content; 'Omnichannel' only when retail/ecommerce context is explicit",
    "pending_answer": true
  }
}
```

This makes interim decisions explicit and trackable, and lowers confidence on conflicted fields automatically.

---

## Tier 4 — Observability (Days, foundational for everything above)

### 4.1 Classification Accuracy Dashboard

**Current state:** Accuracy is measured qualitatively via content team CSV review. No quantitative baseline.

**Proposed:** Track accuracy per-field by comparing classifier output to human corrections. Expose as a simple CLI report:

```
npx tsx scripts/accuracy-report.ts

Field Accuracy (vs human corrections, n=47):
  assetType:    96.2% (1 miss / 26 corrected)
  assetSubType: 89.4%
  topic:        71.3% ← needs attention
  useCases:     68.1% ← needs attention
  funnelStage:  91.5%
  industry:     85.1%
  jobLevel:     73.4% ← needs attention
  jobFunction:  70.2% ← needs attention

Overall: 80.7% field accuracy across 47 corrections
Drift score (last 7 days): 0.08 (stable)
```

This answers: "Is the classifier getting better or worse as we add corrections?"

---

### 4.2 Systematic Prompt Testing (Regression Suite)

**Current state:** Changes to the prompt or signals require re-running all pillar pages manually to check for regressions.

**Proposed:** `scripts/test-classifier.ts` — runs classification on a hardcoded set of 10–15 diverse test entries (mix of content types) and compares output to expected values stored in `tests/classifier-fixtures.json`. If any field differs, the test fails.

```typescript
// tests/classifier-fixtures.json
{
  "hclvhMBxnJbxq8OQQv7HN": {  // Platform pillar page
    "assetType": "Document",
    "assetSubType": "Product",
    "funnelStage": "Evaluation/Engagement (BOFU)",
    "industry": ["Software, IT & Technology"],
    "product": ["Platform"]
  }
}

// scripts/test-classifier.ts
for (const [entryId, expected] of Object.entries(fixtures)) {
  const result = await classifyContent({ entryId, ... });
  const diffs = compareFields(result, expected);
  if (diffs.length > 0) {
    console.error(`FAIL: ${entryId} — ${diffs.join(', ')}`);
    exitCode = 1;
  }
}
```

Run this in CI or pre-commit before any prompt change.

---

## Priority Stack Rank

| # | Improvement | Effort | Impact | Start with |
|---|-------------|--------|--------|-----------|
| 1 | Content hash caching (1.1) | 2h | High | Yes — pure win |
| 2 | `needsReview` semantic fields (1.2) | 1h | High | Yes — 1-liner |
| 3 | Field dependency validation (1.3) | 3h | Med-High | Yes |
| 4 | Expand KNOWN_COMPANY_REGEX (1.4) | 1h | Med | Yes |
| 5 | Regression test suite (4.2) | 4h | High | Yes — safety net |
| 6 | Accuracy report (4.1) | 3h | High | Before Tier 2 |
| 7 | Semantic few-shot selection (2.1) | 1d | High | After baseline |
| 8 | Consistency sampling (2.2) | 1d | Med-High | After baseline |
| 9 | Content-type-aware prompt (2.4) | 0.5d | Med | After baseline |
| 10 | Taxonomy contradiction resolver (3.3) | 0.5d | Med | After taxonomy answered |
| 11 | Rule synthesis from corrections (3.1) | 2d | High | Future |
| 12 | Taxonomy label embeddings (2.3) | 2d | Med | Future |

---

## The Biggest Leverage Point

Of all improvements above, **#7 (semantic few-shot selection)** has the highest ceiling because:

1. The feedback store currently has verified corrections for 7 pages
2. As corrections accumulate to 50–200 entries, the quality gap between "5 most recent" and "5 most relevant" grows dramatically
3. This requires no changes to the AI model or prompt structure — just smarter retrieval

Combined with **#5 (regression tests)** to prevent prompt regressions, these two changes would meaningfully improve accuracy within a week of implementation.

---

## Research Sources

- [STED Structured Output Reliability Framework (OpenReview 2025)](https://openreview.net/forum?id=rSCV1hTZvF)
- [Multi-Label Text Classification Under Few-Shot Scenarios (MDPI 2025)](https://www.mdpi.com/2076-3417/15/16/8872)
- [TELEClass: Taxonomy Enrichment + LLM Text Classification (arXiv)](https://arxiv.org/html/2403.00165)
- [Retrieval-style ICL for Few-shot Hierarchical Text Classification (MIT Press/TACL)](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00697/124630/Retrieval-style-In-context-Learning-for-Few-shot)
- [Uncertainty Quantification and Confidence Calibration in LLMs Survey (arXiv 2025)](https://arxiv.org/abs/2503.15850)
- [Cycles of Thought: LLM Confidence via Stable Explanations (arXiv)](https://arxiv.org/html/2406.03441v1)
- [Survey of LLM-based Active Learning (ACL 2025)](https://aclanthology.org/2025.acl-long.708.pdf)
- [Adaptive Few-Shot Prompting for Multi-Label Classification (Medium)](https://medium.com/@alexandrdzhumurat/smarter-multi-label-predictions-with-adaptive-few-shot-prompting-2b3da7e08239)
- [Contentful AI-Powered Taxonomy Assignment (Help Center)](https://www.contentful.com/help/ai-powered-taxonomy-assignment/)
