# How The App Works

> Last updated: 2026-03-23

This app classifies Contentful content into a controlled taxonomy and writes the results back to Contentful. The current architecture is queue-first, vendor-backed, and fail-fast.

## Local Development

`npm start` now runs the repo-native local dev server in [`scripts/local-dev-server.ts`](../../scripts/local-dev-server.ts).

That server:

- serves files from `public/`
- applies the simple rewrites from [`vercel.json`](../../vercel.json)
- dispatches the existing API handlers directly
- avoids depending on `vercel dev` for normal local route testing

Use `npm run start:vercel` only when you explicitly want Vercel CLI emulation and the machine can reach `api.vercel.com`.

The local server now also wires the health endpoint directly, so both `GET /api/health` and the rewritten `GET /health` path behave the same way in local and deployed environments.

## High-Level Flow

```text
Contentful publish/update
        |
        v
api/webhooks/contentful-classify.ts
        |
        v
classification_jobs table (Postgres)
        |
        v
api/cron/[job].ts (scheduled + on-demand)
        |
        v
Recursive crawler + classifier pipeline
        |
        +--> needs review -> human_review_queue + Contentful review tag
        |
        +--> ready -> taxonomy fields written back to Contentful
```

## Main Entry Points

### 1. Webhook ingestion

[`api/webhooks/contentful-classify.ts`](../../api/webhooks/contentful-classify.ts)

- Verifies the Contentful webhook using [request verification](https://www.contentful.com/developers/docs/webhooks/request-verification/) (`verifyRequest` from `@contentful/node-apps-toolkit` with `CONTENTFUL_WEBHOOK_SECRET`; optional `CONTENTFUL_WEBHOOK_SECRET_PREVIOUS` for rotation). Set `CONTENTFUL_WEBHOOK_SIGNING_PATH` if your public URL path differs from the default `/webhooks/contentful` (see `vercel.json` rewrites).
- Ignores self-triggered updates to prevent classification loops
- Enqueues a classification job instead of doing expensive work inline
- Falls back to direct classification only if queuing is unavailable

### 2. Background worker

[`api/cron/[job].ts`](../../api/cron/[job].ts)

- Claims queued jobs from Postgres
- Fetches the latest entry from Contentful
- Extracts recursive text content from linked entries
- Runs the classifier
- Either writes taxonomy back to Contentful or routes the item into human review
- Retries rate-limit and vendor dependency failures

### 3. Classifier pipeline

[`api/_shared/tools/classificationTool.ts`](../../api/_shared/tools/classificationTool.ts)

The classifier runs in five layers (aligned with the README diagram):

1. Layer 0: content type profiles (deterministic constraints)
2. Layer 1: deterministic signals and local NLP enrichment
3. Layer 2: company enrichment and external lookup hints
4. Layer 3: chained Gemini prompts with dynamic few-shot retrieval
5. Layer 4: strict normalization, overrides, confidence routing, and validation

### 4. Interactive sidebar route

[`api/tools/[tool]/execute.ts`](../../api/tools/[tool]/execute.ts)

The sidebar classify button now uses the same real classifier path as the queue worker for core classification.

It still uses:

- the real Contentful entry fetch
- the real recursive crawler
- the real chained classifier

The main remaining differences are around request shaping and runtime ergonomics, not a separate “fake fast path”:

- static allowed taxonomy labels are used instead of loading org taxonomy labels live
- the route still performs real Contentful fetch + deep crawl
- the route still runs NLP enrichment and dynamic few-shot retrieval by default
- latency is reduced primarily through bounded crawl text, compressed prompts, and a lighter subjective-stage model

Queue and batch classification still use the same classifier core, but their surrounding orchestration differs because they run as background jobs and handle review-queue side effects.

### 5. Internal read routes

The graph/feed/analytics/CRM read routes are now treated as internal product surfaces, not public utilities.

- `api/graph/[action].ts`
- `api/feeds/[...feed].ts`
- `api/analytics/content-mix.ts`
- `api/crm/recommendations.ts`

These routes now require the same `CONTENT_GRAPH_APP_TOKEN` auth used by the sidebar/review APIs.

### 6. Slack command ingress

[`api/slack/[action].ts`](../../api/slack/[action].ts)

- `/slack/health` remains an unauthenticated health check
- `/slack/cg` now verifies Slack request signatures with `SLACK_SIGNING_SECRET`
- requests must include valid `x-slack-signature` and `x-slack-request-timestamp`
- the timestamp is bounded to a replay window before the graph query is executed

### 7. Health and runtime hardening

[`api/health.ts`](../../api/health.ts)
[`api/_shared/storage/index.ts`](../../api/_shared/storage/index.ts)
[`api/_shared/utils/rateLimit.ts`](../../api/_shared/utils/rateLimit.ts)
[`api/_shared/utils/logger.ts`](../../api/_shared/utils/logger.ts)
[`api/_shared/utils/costTracker.ts`](../../api/_shared/utils/costTracker.ts)
[`api/_shared/utils/classifierErrors.ts`](../../api/_shared/utils/classifierErrors.ts)

- `/api/health` returns deployment version, uptime, required-env status, and Postgres connectivity.
- [`vercel.json`](../../vercel.json) now rewrites `/health` to `/api/health` for load balancers and uptime checks.
- The local dev server registers the same health handler so smoke tests do not need Vercel CLI emulation.
- Postgres TLS is now verified by default outside explicit localhost connections; providers with custom CAs must use `NODE_EXTRA_CA_CERTS`.
- Shared helpers now include:
  - structured JSON logging for machine-parsable runtime events
  - a reusable in-memory rate limiter for internal surfaces
  - per-model token/cost accounting with optional monthly budget caps
  - retriable vendor-error classification for timeout/rate-limit style failures

## Scheduling

[`vercel.json`](../../vercel.json) registers two daily cron jobs (compatible with Vercel Hobby’s once-per-day limit):

- `/api/cron/update-graph` — daily content graph refresh
- `/api/cron/process-classification-queue` — drains queued classification jobs

The cron handlers also support **`/api/cron/daily-maintenance`**, which runs queue processing and graph update in one request (useful for custom schedulers).

On **Vercel Pro**, you can change the `process-classification-queue` schedule to run every few minutes (for example `*/5 * * * *`) so the queue stays current. **Hobby** is limited to daily cron execution; for more frequent drains without Pro, use [`.github/workflows/drain-classification-queue.yml`](../../.github/workflows/drain-classification-queue.yml) (POST every five minutes when repo secrets `CONTENT_GRAPH_PRODUCTION_URL` and `CRON_SECRET` are set), or `POST` the same cron endpoint from another scheduler with the bearer token (`Authorization: Bearer $CRON_SECRET`). Vercel invokes cron URLs with **GET**; handlers accept **POST** for manual runs.

## Classification Pipeline

### Layer 0: Content type profiles

[`config/content-type-profiles.json`](../../config/content-type-profiles.json) · [`api/_shared/config/contentTypeProfiles.ts`](../../api/_shared/config/contentTypeProfiles.ts)

- Applies deterministic per-type constraints before model calls

### Layer 1: Signals and NLP

[`api/_shared/utils/contentSignals.ts`](../../api/_shared/utils/contentSignals.ts)
[`api/_shared/utils/nlpPipeline.ts`](../../api/_shared/utils/nlpPipeline.ts)

- Extracts deterministic facts from URL, content type, CTA patterns, schema cues, and content structure
- Calls the local NLP sidecar for:
  - GLiNER entity extraction
  - zero-shot intent classification
- Produces facts that reduce ambiguity before Gemini runs

### Layer 2: Company enrichment

[`api/_shared/utils/companyCache.ts`](../../api/_shared/utils/companyCache.ts)

- Resolves company references into industry and company-size hints
- Uses cache-first lookup behavior
- Avoids applying company enrichment where logos are just examples, not targeting signals

### Layer 3: Prompt chain and dynamic few-shot

[`api/_shared/prompts/classifierPrompts.ts`](../../api/_shared/prompts/classifierPrompts.ts)
[`api/_shared/utils/feedbackStore.ts`](../../api/_shared/utils/feedbackStore.ts)
[`api/_shared/utils/chromaStore.ts`](../../api/_shared/utils/chromaStore.ts)
[`api/_shared/utils/googleProvider.ts`](../../api/_shared/utils/googleProvider.ts)

- Gemini no longer does one giant classification prompt
- Prompt A handles objective fields first:
  - topic
  - product
  - schema
- Prompt B handles more subjective fields second:
  - funnel stage
  - audience
  - job-oriented taxonomy fields
- Few-shot examples are selected dynamically from embedded human corrections stored in Chroma
- Model transport is abstracted behind `googleProvider.ts`, so the same classifier path can run against direct Gemini or Vertex AI

### Layer 4: Validation and routing

[`api/_shared/config/classifierPipeline.ts`](../../api/_shared/config/classifierPipeline.ts)
[`api/_shared/config/classifierPolicy.ts`](../../api/_shared/config/classifierPolicy.ts)
[`api/_shared/tools/contentfulAppTool.ts`](../../api/_shared/tools/contentfulAppTool.ts)
[`api/_shared/utils/confidenceCalibration.ts`](../../api/_shared/utils/confidenceCalibration.ts)

- Enforces allowed taxonomy values
- Applies versioned classifier policy
- Applies deterministic overrides
- Preserves multi-select fields where policy allows them
- Strips internal-only title annotations before classification
- Leaves `audience` empty unless the content has explicit audience evidence
- Rejects invalid values instead of silently inventing taxonomy
- Sends low-confidence results to review instead of auto-applying them
- Recalibrates confidence scores against observed human-corrected accuracy when a calibration profile is available

## Deterministic Evaluation

The repo now distinguishes between three different levels of proof:

1. Signal-level fixtures (`scripts/golden-dataset-check.ts`)
2. Committed classifier replay fixtures (`scripts/test-classifier.ts`)
3. Artifact integrity checks (`scripts/check-classifier-artifacts.ts`)

What changed in practice:

- `test:golden` still validates deterministic signal extraction only
- `test:classifier` now replays committed classifier fixtures through deterministic runtime policy and review routing
- `test:repeatability` reruns the live classifier against the same fixture multiple times when Gemini/Vertex credentials are present and reports field-level drift
- `check:classifier-artifacts` validates that replay fixtures, committed corrections, and the calibration profile are internally consistent
- `.github/workflows/classifier-evals.yml` runs the deeper non-blocking eval/reporting lane for Phoenix and judge-based workflows when secrets are present

## Policy And Governance

Classifier behavior is now governed as versioned policy, not just code branches.

Files:

- [`api/_shared/config/classifierPolicy.ts`](../../api/_shared/config/classifierPolicy.ts)
- [`docs/governance/CLASSIFIER_CHANGELOG.md`](../governance/CLASSIFIER_CHANGELOG.md)
- [`scripts/check-classifier-governance.mjs`](../../scripts/check-classifier-governance.mjs)
- [`docs/current/CLASSIFIER_LOGIC.md`](./CLASSIFIER_LOGIC.md)

The local repo hook can be installed with:

```bash
npm run hooks:install
```

That hook blocks classifier runtime changes unless they ship with:

- a policy or prompt asset update
- a docs update
- an evaluation or calibration artifact update

## Confidence Calibration

The classifier now distinguishes between:

- raw model confidence
- deterministic override confidence
- calibrated confidence

Calibrated confidence is derived from real overlap between:

- `.cache/classification-history.json`
- `seeds/feedback-corrections.json`
- `.cache/feedback-corrections.json`

The generated profile is stored in [`seeds/confidence-calibration.json`](../../seeds/confidence-calibration.json) and applied at runtime through [`api/_shared/utils/confidenceCalibration.ts`](../../api/_shared/utils/confidenceCalibration.ts).

Generate or refresh the profile with:

```bash
npx tsx scripts/calibrate-confidence.ts
```

What the calibration does:

- measures how often a given confidence band was actually correct
- smooths small-sample bands to avoid overfitting
- enforces monotonic calibration bands
- recalculates `overallConfidence` from calibrated field scores

This means the final confidence score is no longer only Gemini self-reporting under the prompt rubric.

Important constraint:

- if there is not enough reviewed overlap data, the runtime marks confidence as not data-backed via advisory metadata instead of pretending it is statistically calibrated

## Synthetic Research Lane

Synthetic research is now an offline evaluation tool, not a runtime decision source.

Files:

- [`scripts/generate-synthetic-research-fixtures.ts`](../../scripts/generate-synthetic-research-fixtures.ts)
- [`scripts/evaluate-synthetic-research.ts`](../../scripts/evaluate-synthetic-research.ts)

Purpose:

- generate realistic ambiguous taxonomy cases
- stress low-performing fields found in the calibration profile
- expand edge-case evaluation coverage
- keep synthetic output separate from human-corrected ground truth

Generate synthetic fixtures:

```bash
env DOTENV_CONFIG_PATH=.env.production.local \
node --require dotenv/config --import tsx scripts/generate-synthetic-research-fixtures.ts --count 12
```

Evaluate them:

```bash
env DOTENV_CONFIG_PATH=.env.production.local \
node --require dotenv/config --import tsx scripts/evaluate-synthetic-research.ts
```

The synthetic fixture file lives at [`tests/synthetic-research-fixtures.json`](../../tests/synthetic-research-fixtures.json) when generated.

## Runtime Services

The local enterprise stack is defined in [`docker-compose.enterprise.yml`](../../docker-compose.enterprise.yml).

### Required local services

- Postgres
  - queue state
  - review queue
  - persistent job tracking
- Chroma
  - semantic retrieval for few-shot examples
- NLP sidecar
  - GLiNER NER
  - zero-shot classification
- Phoenix
  - OpenTelemetry trace collection

### External services

- Contentful
  - source content
  - taxonomy writeback
- Gemini or Vertex
  - chained classification prompts

The runtime provider switch is implemented in:

- [`googleProvider.ts`](../../api/_shared/utils/googleProvider.ts)

## Local Database Default

The repo now defaults to local Postgres in [`.env.production.local`](../../.env.production.local):

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/content_graph
POSTGRES_URL=postgres://postgres:postgres@127.0.0.1:5433/content_graph
POSTGRES_PRISMA_URL=postgres://postgres:postgres@127.0.0.1:5433/content_graph
POSTGRES_URL_NON_POOLING=postgres://postgres:postgres@127.0.0.1:5433/content_graph
```

Local Postgres is the supported default for queue and review persistence in this repo.

## Failure Policy

The app defaults to **strict vendor mode** (`CLASSIFIER_STRICT_VENDOR_MODE`, on by default). Individual dependencies are only **required** when they are configured (`CLASSIFIER_REQUIRE_NLP`, `CLASSIFIER_REQUIRE_CHROMA`, etc. are derived from `classifierPipeline.ts`). For example, without `CHROMA_URL`, Chroma is not required and the pipeline can fall back to other few-shot strategies.

[`api/_shared/utils/classifierErrors.ts`](../../api/_shared/utils/classifierErrors.ts)
[`api/_shared/utils/vendorObservability.ts`](../../api/_shared/utils/vendorObservability.ts)

- No silent fallback for required vendors
- When a vendor is required and fails, classification fails with `VendorDependencyError` (no degraded publish)
- Queue workers retry retriable vendor errors instead of publishing degraded results
- Low-confidence classification becomes `needs review`, not a hidden best guess

## Human Review Flow

[`api/_shared/utils/reviewQueue.ts`](../../api/_shared/utils/reviewQueue.ts)
[`api/review/[action].ts`](../../api/review/[action].ts)

- If confidence is below threshold, the worker stores a review item in Postgres
- The Contentful entry gets the review-state update without applying taxonomy concepts
- Slack alert hooks exist through the review queue utility
- Approving a review clears the pending review state and applies the corrected result

## Observability

[`api/_shared/utils/observability.ts`](../../api/_shared/utils/observability.ts)

Each classification run records:

- prompt version
- selected few-shot examples
- vendor strategy used
- token usage
- latency
- trace metadata for debugging misclassifications
- confidence calibration metadata

Phoenix is the active local tracing target. LangSmith can also be enabled if credentials are provided.

Local default service ports:

- Postgres: `5433`
- Chroma: `8001`
- NLP sidecar: `8090`
- Phoenix UI: `6006`
- Phoenix HTTP traces: `6006/v1/traces`

## Start The App Locally

### 1. Start vendor services

```bash
docker compose -f docker-compose.enterprise.yml up -d
```

### 2. Provision taxonomy and review tag

```bash
npx tsx scripts/setup-taxonomy.ts
npx tsx scripts/ensure-review-tag.ts
```

### 3. Sync correction embeddings

```bash
npx tsx scripts/embed-corrections.ts
npm run sync:chroma
```

### 4. Run classification manually

```bash
env DOTENV_CONFIG_PATH=.env.production.local \
node --require dotenv/config --import tsx scripts/classify-pillar-pages.ts --dry-run --force
```

### 5. Run the queue worker

```bash
env DOTENV_CONFIG_PATH=.env.production.local \
curl -X POST http://127.0.0.1:3000/api/cron/process-classification-queue \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Verification

Deterministic checks:

```bash
npm run check
npx tsx scripts/test-classifier.ts
npx tsx scripts/check-classifier-repeatability.ts --fixture platform-pillar --runs 3
npx tsx scripts/golden-dataset-check.ts --min-accuracy 0.95
npx tsx scripts/check-classifier-artifacts.ts
npx tsx scripts/calibrate-confidence.ts
```

Live validation already completed against:

- real Contentful content
- real Gemini calls
- local Chroma
- local NLP sidecar
- local Phoenix
- local Postgres queue persistence

## Database Mode

This repo is currently standardized on local Postgres for persistent classifier state:

- `classification_jobs`
- `human_review_queue`
- observability and review persistence

There is no remaining hosted database dependency in the default local workflow.
