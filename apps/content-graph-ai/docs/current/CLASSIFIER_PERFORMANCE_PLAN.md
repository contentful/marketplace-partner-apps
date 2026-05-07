# Bulk Classification Performance Plan

> Last updated: 2026-03-24

This plan focuses on speeding up bulk runs driven by `scripts/classify-pillar-pages.ts` without degrading taxonomy quality blindly.

## Current Bottlenecks

Observed on the 2026-03-24 `pageCaseStudy` rerun with prompt version `2026-03-24-chain-v5`:

- CDA crawl is rate-limited before classification starts.
- Fact-stage Gemini is the dominant per-entry cost, typically ~15-26s.
- Subjective-stage Gemini is much cheaper, typically ~0.9-2s.
- Query embedding + few-shot retrieval usually adds ~0.2-0.7s.
- Company enrichment is usually negligible when cache hits.

## Implemented Now

- Split crawl concurrency from classify concurrency in [classify-pillar-pages.ts](../../scripts/classify-pillar-pages.ts).
- New knobs:
  - `--crawl-concurrency`
  - `--classify-concurrency`
  - existing `--concurrency` remains as a fallback for classify concurrency
- Added pre-crawl reuse of unchanged rows from the latest native export when the entry has not changed since its last recorded classification.
- Added bulk flags:
  - `--no-reuse-unchanged`
  - `--skip-few-shot`
  - `--use-few-shot`
- Case-study bulk runs now disable dynamic few-shot retrieval by default via governed policy.
- Structured bulk runs can now pass a smaller fact-stage body excerpt limit; case-study batches default to `1200` chars via governed policy.

Why:

- CDA crawl and Gemini classification were previously sharing one concurrency limit.
- That caused avoidable crawl stalls from Contentful rate limiting even when model throughput could stay higher.

## Prioritized Next Steps

1. Reduce fact-stage model cost first.
   - Expected impact: Very high.
   - Risk: Medium.
   - Main files:
     - [classifierPipeline.ts](../../api/_shared/config/classifierPipeline.ts)
     - [classificationTool.ts](../../api/_shared/tools/classificationTool.ts)

2. Stream CSV output and resumable run state.
   - Expected impact: Medium operationally.
   - Risk: Low.
   - Main file:
     - [classify-pillar-pages.ts](../../scripts/classify-pillar-pages.ts)

3. Benchmark a lower-cost fact-stage model on the reviewed golden set before changing defaults.
   - Expected impact: High.
   - Risk: Medium.
   - Main files:
     - [classifierPipeline.ts](../../api/_shared/config/classifierPipeline.ts)
     - [tests/golden-signal-fixtures.json](../../tests/golden-signal-fixtures.json)

## Success Metrics

- Median crawl wait time per entry
- Median fact-stage latency
- End-to-end pages/minute for `pageCaseStudy`
- Accuracy delta vs current reviewed benchmark
- Retry count from CDA and Gemini paths
