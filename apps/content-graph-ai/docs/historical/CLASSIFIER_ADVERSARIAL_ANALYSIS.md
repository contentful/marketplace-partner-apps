# Taxonomy Classifier — Adversarial Analysis
> Historical adversarial review from 2026-03-03. Some findings here have since been fixed in the current runtime.

**Date:** 2026-03-03  
**Method:** Adversarial prompting (7-phase critique)  
**Scope:** All 15+ taxonomy fields, full 4-layer pipeline

---

## Critical Gaps (Tier 1 — Implement Now)

| Gap | Field | Root Cause | Fix |
|-----|-------|-----------|-----|
| Year not extracted from title | Year Published | No regex on title year | `title.match(/\b(20\d{2})\b/)` → hard override |
| Region always "Global" for locale URLs | Region | No locale prefix detection | `/de/` `/en-gb/` → EMEA/UKI/APAC map |
| Audience not hard-overridden for URL patterns | Audience | Prompt hint only, no post-processing | `/products/` → Prospect, `/docs/` → Direct Customer, `/partners/` → Tech/ISV |
| Industry AI-guessed when no companies mentioned | Industry | Company enrichment returns empty | isProductPage + low confidence → "Software, IT & Technology" |
| Pricing pages get null schema type | Schema Type | Missing `urlPattern === 'pricing'` case | → SoftwareApplication |
| CDA tokens accumulate, never deleted | Infrastructure | No cleanup in finally block | `space.deleteApiKey(createdKeyId)` |

---

## Scale Risks (Tier 2 — Before Running 100+ Pages)

| Risk | Severity | Fix |
|------|---------|-----|
| No concurrency limit → Gemini quota exhaustion at 15+ parallel calls | HIGH | Max 5 concurrent Gemini calls |
| No retry on transient errors (HeadersTimeoutError) | HIGH | 3 retries with exponential backoff |
| `needsReview` based on average confidence — high-confidence overrides (Language 0.99, UsageRights 0.99) mask uncertain semantic fields | MEDIUM | Use weakest of semantic fields (Topic, JobLevel, JobFunction, UseCases, FunnelStage) |

---

## Quality Improvements (Tier 3)

| Issue | Field | Fix |
|-------|-------|-----|
| Solution pages get `assetSubType = 'Product'` (wrong — they describe use cases) | Asset Sub-Type | Change to `null` → AI decides between Webpage/One pager |
| Topic/Use Cases fully AI-inferred, inconsistent across runs | Topic, Use Cases | Product → topic hint mapping (Studio→Content ops, AI Actions→AI, Ecosystem→Integrations) |
| KNOWN_COMPANY_REGEX covers only ~50 companies, no `i` flag | Company enrichment | Add case-insensitive flag, expand list |
| Prompt Topic/Use Cases lists diverge from BYNDER_TAXONOMY allowed values | Taxonomy drift | Single-source JSON for allowed values |

---

## Implementation Order

```
1. contentSignals.ts:
   - yearPublished: title.match(/\b(20\d{2})\b/)
   - region: URL locale prefix map (/de/ → EMEA, etc.)

2. classificationTool.ts post-processing:
   - Wire yearPublished override
   - Wire region override  
   - Add audience override (product→Prospect, docs→Direct Customer, partner→Tech/ISV)
   - Add industry fallback (isProductPage + low confidence → Software, IT & Technology)
   - Add pricing → SoftwareApplication schema type
   - Fix needsReview: weakest semantic field threshold

3. classify-pillar-pages.ts:
   - Add p-limit or manual concurrency cap (max 5 parallel Gemini calls)
   - Wrap classifyContent in retry wrapper (3 attempts, backoff: 1s, 2s, 4s)
   - Add CDA token cleanup in finally block

4. (Optional) contentSignals.ts:
   - Product → topic hint mapping as signal hint (not hard override)
   - Expand KNOWN_COMPANY_REGEX + add /i flag
```
