# Enterprise Vendor Setup

See [HOW_THE_APP_WORKS.md](./HOW_THE_APP_WORKS.md) for the end-to-end request flow, queue behavior, classifier layers, and local runtime defaults.

## Included Integrations

- LangSmith tracing
- Arize Phoenix tracing via OpenTelemetry
- Chroma vector retrieval
- GLiNER + zero-shot NLP sidecar
- DSPy prompt-optimization utility
- Gemini direct provider
- Vertex AI provider
- Postgres-backed queue and review persistence

## Start Local Vendor Services

```bash
docker compose -f docker-compose.enterprise.yml up -d
```

The `nlp-sidecar` service now supports both modes:

- local dev: source build from [`vendor/python/Dockerfile.sidecar`](../../vendor/python/Dockerfile.sidecar)
- CI: preferred prebuilt image from `ghcr.io/zuhur-contentful/content-graph-nlp-sidecar:latest`

The publisher workflow is [`.github/workflows/build-nlp-sidecar.yml`](../../.github/workflows/build-nlp-sidecar.yml). It rebuilds and pushes the sidecar image when the sidecar source changes, so [`.github/workflows/live-trace.yml`](../../.github/workflows/live-trace.yml) can pull the image instead of rebuilding it on every trace run.

## Relevant Environment Variables

```bash
CLASSIFIER_NLP_ENDPOINT=http://127.0.0.1:8090/extract
CHROMA_URL=http://127.0.0.1:8001
CHROMA_COLLECTION=content-graph-corrections
CLASSIFIER_STRICT_VENDOR_MODE=true
CLASSIFIER_REQUIRE_NLP=true
CLASSIFIER_REQUIRE_CHROMA=true
CLASSIFIER_REQUIRE_OTEL=true
CLASSIFIER_REQUIRE_LANGSMITH=false
CLASSIFIER_ENABLE_EMBEDDING_CACHE=false
LANGSMITH_API_KEY=...
LANGSMITH_PROJECT=Taxonomy-Contentful   # or your preferred project name
LANGSMITH_TRACING=true
PHOENIX_COLLECTOR_ENDPOINT=http://127.0.0.1:6006/v1/traces
PHOENIX_PROJECT_NAME=content-graph
DATADOG_OTLP_ENDPOINT=https://otlp-http-intake.logs.datadoghq.com/v1/traces
DD_API_KEY=...
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/content_graph
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_VERTEX_PROJECT=lead-normalization
GOOGLE_VERTEX_LOCATION=global
```

## Provider Routing

The model transport is selected in:

- [googleProvider.ts](../../api/_shared/utils/googleProvider.ts)

Rules:

- if `GOOGLE_GENAI_USE_VERTEXAI=true` or `GOOGLE_VERTEX_PROJECT` is set, runtime uses Vertex AI
- otherwise runtime uses the direct Gemini provider

This provider abstraction is shared by:

- the classifier
- embedding generation
- some enrichment flows

## Failure Policy

- Vendor failures are fatal when their corresponding `CLASSIFIER_REQUIRE_*` flag is `true`.
- The classifier no longer degrades silently from Chroma, the NLP sidecar, or observability exporters when those services are required.
- Queue workers will retry vendor dependency failures instead of publishing fallback taxonomy.

## Provisioning

```bash
npx tsx scripts/setup-taxonomy.ts
npx tsx scripts/ensure-review-tag.ts
npx tsx scripts/embed-corrections.ts
npm run sync:chroma
npx tsx scripts/calibrate-confidence.ts
npm run hooks:install
```

The repo defaults to the local Postgres service for queue and observability persistence:

```bash
export DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/content_graph
export POSTGRES_URL=$DATABASE_URL
```

## DSPy Optimization

```bash
python vendor/python/optimize_prompts.py
```

## Offline Research And Calibration

- `npx tsx scripts/calibrate-confidence.ts`
  - builds `seeds/confidence-calibration.json` from human corrections and classification history
- `npm run generate:synthetic`
  - generates synthetic edge-case fixtures for ambiguous taxonomy research
- `npm run evaluate:synthetic`
  - runs the classifier against those synthetic fixtures as a secondary evaluation lane

## Governance Guardrail

Classifier changes are expected to follow the enterprise change standard.

Install the hook once per checkout:

```bash
npm run hooks:install
```

That registers [.githooks/pre-commit](../../.githooks/pre-commit), which runs:

- [check-classifier-governance.mjs](../../scripts/check-classifier-governance.mjs)

It blocks classifier runtime commits that do not include:

- policy or prompt asset updates
- docs updates
- evaluation or calibration updates

The broader repo docs guard can be layered on top of this so route/config changes also require matching documentation updates.
