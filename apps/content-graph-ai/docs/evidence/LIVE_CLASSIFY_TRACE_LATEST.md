# Live Classify Trace

- Captured at: `2026-03-23T18:46:42.464Z`
- Entry ID: `hclvhMBxnJbxq8OQQv7HN`
- Overall confidence: `0.94`
- Needs review: `false`

## Final Fields

- `assetSubType`: Product (95%)
- `product`: Platform (97%)
- `topic`: Headless CMS (99%)
- `useCases`: Digital experiences (95%)
- `industry`: Software, IT & Technology (99%)
- `funnelStage`: Evaluation/Engagement (BOFU) (99%)
- `jobFunction`: Content, IT/Engineering (99%)
- `jobLevel`: Director, VP (99%)
- `audience`: none (50%)
- `language`: EN (99%)

## Crawl Snapshot

- Title: Platform (June & Fall Launch 2025 Updates)
- Slug: products/platform
- Content type: page
- Crawl source: cda
- Text length: 33025

## Stage Timings

- Deep crawl: `443ms` (contentful-cda/deep-crawl-entry, status=ok)
- NLP enrichment: `7449ms` (nlp-sidecar/enrich-content-signals, status=ok)
- Few-shot embeddings: `459ms` (google-ai-studio/embed-few-shot-query, status=ok)
- Few-shot retrieval: `72ms` (chroma/query-few-shot-corrections, status=ok)
- Fact stage: `27575ms` (gemini/fact-stage-classification, status=ok)
- Subjective stage: `1513ms` (gemini/subjective-stage-classification, status=ok)
- OTEL export: `38ms` (otel/export-classification-run, status=ok)
- LangSmith flush: `89ms` (langsmith/flush-pending-traces, status=ok)

## Vendors

- `chroma`
- `contentful-cda`
- `contentful-management`
- `gemini`
- `google-ai-studio`
- `langsmith`
- `nlp-sidecar`
- `otel`
- `postgres`

## Wiring

- `contentful-management -> contentful-cda`: management API resolves the crawl root before CDA deep crawl
- `contentful-cda -> signal-extraction`: deep-crawled Contentful text becomes classifier input
- `signal-extraction -> nlp-sidecar`: heuristic signals are enriched by the NLP sidecar
- `signal-extraction -> google-ai-studio`: page summary becomes an embedding query for few-shot retrieval
- `google-ai-studio -> chroma`: query embedding is used to retrieve similar corrected examples
- `few-shot-selection -> gemini-fact-stage`: retrieved examples are injected into the fact-stage prompt
- `gemini-fact-stage -> gemini-subjective-stage`: fact output is summarized into the subjective-stage prompt
- `classification-result -> otel`: final result is exported to OTEL collectors
- `classification-result -> postgres`: final result is persisted into classification_runs
- `classification-result -> langsmith`: pending LangSmith traces are flushed after classification completes

## Review Reasons

- [info] Confidence not calibrated — 9 of 25 human-reviewed entries completed. Approve 16 more entries to enable data-backed calibration. Until then, scores are raw model confidence.
- [info] Semantic calibration gaps — topic, jobLevel, jobFunction, useCases, funnelStage, industry still lack field-level data backing at this confidence band.
