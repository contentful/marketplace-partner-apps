# Live Classify Trace

Date: 2026-03-19
Entry ID: `hclvhMBxnJbxq8OQQv7HN`
Entry title: `Platform (June & Fall Launch 2025 Updates)`
Raw artifact: [`docs/evidence/LIVE_CLASSIFY_TRACE_2026-03-19.json`](./LIVE_CLASSIFY_TRACE_2026-03-19.json)

## What this is

This is a real, uncached run of the deep-crawl classifier against a live Contentful entry.

The capture was produced by:

```bash
env DOTENV_CONFIG_PATH=.env.production.local \
  node --require dotenv/config --import tsx \
  scripts/capture-live-classification-trace.ts \
  hclvhMBxnJbxq8OQQv7HN \
  --out docs/evidence/LIVE_CLASSIFY_TRACE_2026-03-19.json
```

## What is included

- `routeTrace`
  - Contentful init
  - deep crawl output
- `vendorTrace`
  - vendor-by-vendor calls with input summaries, outputs, durations, and status
  - wiring edges that show how Contentful, retrieval, Gemini, and exporters connect
- `logs`
  - emitted runtime logs
  - fact-stage output
  - subjective-stage output
  - post-processing output
- `result.debugTrace.steps`
  - structured per-step outputs from the classifier itself

## Key runtime observations

- The run was real and uncached.
- The older raw JSON artifact at this path is still useful for full per-step inspection, but the latest confirmed live behavior is better than that JSON snapshot.
- The newest live verification run on March 19, 2026 completed successfully on prompt version `2026-03-19-chain-v4` with `overallConfidence: 0.93` and `needsReview: false`.
- That latest live run confirmed final `topic=Headless CMS`, `industry=Software, IT & Technology`, `assetSubType=Product`, empty `audience`, `jobFunction=[Content, IT/Engineering]`, `jobLevel=[Director, VP]`, and `yearPublished=2025`.
- In that latest live run, the remaining feedback-store corrections were still limited to `jobFunction` and `jobLevel`; `topic` and `industry` no longer needed human correction.
- The generic `page` + product-URL case no longer emits `Q12`; the saved trace now shows `openQuestionFlags: []` for this entry.
- Total classifier time dropped to about `31.9s` end-to-end for the classifier itself, with about `35.9s` wall-clock including Contentful fetch and deep crawl.
- Major stage timings in the latest live run:
  - `signalExtractionMs: 7`
  - `nlpMs: 7784`
  - `queryEmbeddingMs: 1323`
  - `fewShotSelectionMs: 71`
  - `factPromptMs: 20638`
  - `subjectivePromptMs: 2062`
- The biggest runtime win came from the lighter subjective pass. It is no longer replaying the full company block and few-shot block, and it now defaults to `gemini-2.5-flash-lite`.
- Deep crawl and entry fetch were also healthy in the latest live run:
  - entry fetch completed by about `1.9s`
  - deep crawl completed by about `3.7s`
  - NLP enrichment completed by about `11.5s`
  - fact-stage generation completed around `35.7s`
- The latest recapture path with exporters enabled had already exported cleanly to Phoenix via OTEL and successfully flushed the pending LangSmith traces produced by the nested traceable steps.

## Vendor map

- `contentful-management`
  - creates the management client
  - resolves space and environment
  - fetches the entry before crawl
- `contentful-cda`
  - performs the real deep crawl that feeds the classifier
- `nlp-sidecar`
  - extracts entities and intents from the crawled body
- `google-ai-studio`
  - generated the live embedding used for few-shot retrieval in this run
- `chroma`
  - returned the nearest human-corrected examples for few-shot injection
- `gemini`
  - ran both the fact-stage and subjective-stage classifiers
- `postgres`
  - persisted the finished run into `classification_runs`
- `langsmith`
  - flushed the pending traceable runs for this classification after the pipeline completed
- `otel`
  - exported the run successfully to the local Phoenix collector
- `phoenix prompt registry`
  - now stores versioned fact-stage and subjective-stage prompt templates for this classifier

## Wiring summary

- `contentful-management -> contentful-cda`
  - the management API resolves the crawl root first
- `contentful-cda -> signal-extraction`
  - the bounded deep-crawl text becomes classifier input
- `signal-extraction -> nlp-sidecar`
  - heuristics are enriched by external NLP
- `signal-extraction -> google-ai-studio -> chroma`
  - the page summary became a live embedding query, and Chroma returned the nearest corrected examples
- `few-shot-selection -> gemini-fact-stage -> gemini-subjective-stage`
  - retrieved examples and fact output are chained through the two Gemini prompts
- `classification-result -> postgres/langsmith/otel`
  - the final result is persisted and exported to the observability sinks that actually ran

## What improved

- The deep crawl is now bounded to about `33,025` characters instead of `12,094,283`.
- The signal stage now correctly reports `language: EN`.
- The bad self-hit was removed from few-shot retrieval. The current entry is no longer used as one of its own examples.
- Company enrichment is now skipped for this `page` profile, and the prompt explicitly suppresses brand mentions as company-enrichment context for this content type.
- The season leak is fixed for this product page. The title still contains release text (`June & Fall Launch 2025 Updates`), but the final classification no longer retains a `season` field because product pages are not treated as seasonal campaigns.
- Broad public pages no longer get `audience=Prospect` injected as a fake default. Audience is now left empty unless the content or URL explicitly targets a real audience group such as docs customers, partners, or internal careers content.
- Matching human corrections no longer get counted as real overrides in the trace. On this platform page, `jobFunction` and `jobLevel` now land on the corrected final values before the feedback layer, so the remaining `humanOverrides` list is down to the genuinely unresolved fields.
- The classifier prompts are now versioned in Phoenix under `content-taxonomy-fact-stage` and `content-taxonomy-subjective-stage`, so prompt lineage is visible outside the codebase.
- The persisted `classification_runs.trace` payload now includes the same vendor calls and wiring graph shown in the saved live artifact, so Postgres, Phoenix, and the capture file are aligned.
- The final `reasoning` field now appends a `FINAL OUTPUT SNAPSHOT`, so policy normalization and human overrides are visible directly in the saved result instead of only in intermediate trace steps.
- The live runtime is materially lower than the earlier `75-80s` path because subjective-stage prompt size and model latency were both cut down.
- The trace still shows existing human feedback overrides, but the underlying evidence path is much cleaner than the earlier capture.
- The intermediate subjective-stage reasoning can still mention broader candidate labels before post-processing trims them. The final saved fields are the source of truth.

## Remaining caveats

- Signal extraction still sees a few third-party names (`Segment`, `DocuSign`, `Kraft Heinz`) in the first page sample. They no longer drive company enrichment for this profile, but they are still present as observations in the trace.
- The human overrides remain visible in post-processing, so this artifact still reflects a real production-like run with feedback-store corrections applied.
- The raw JSON artifact in this file path is still from the older heavy capture flow. The current runtime behavior is better than that JSON suggests, and the latest live verification is reflected in this Markdown summary until the heavy trace capture helper is fully stabilized.

## Recommended inspection order

1. Open the raw JSON trace.
2. Read `routeTrace[1]` to inspect the bounded deep-crawl payload size and preview.
3. Read `vendorTrace.calls` to see exactly which vendors ran, what they received, and what they returned.
4. Read `vendorTrace.wiring` to understand how those vendor calls connect.
5. Read the `fact-stage` output to see the first-pass objective classification.
6. Read the `subjective-stage` output to see audience/job/funnel reasoning.
7. Read `post-processing` to see what was changed after model output, especially:
   - human overrides
   - final fields
   - review reasons
