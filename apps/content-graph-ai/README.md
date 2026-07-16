# Content Graph AI

Content Graph AI is a Contentful sidebar app and taxonomy pipeline that classifies content into a governed metadata model, explains why each field was chosen, and routes uncertain cases for human review.

This submission is intended to give the Contentful team the full app source needed to review, harden, and productize the app for customer use.

Creator: Zuhur Ahmed

## What the app does

- Classifies Contentful entries across a governed field set used for taxonomy and graph enrichment
- Runs a layered classification pipeline combining deterministic signals, governed policy, model inference, and human corrections
- Surfaces reviewer-facing reasoning so editors can understand why a field was selected
- Keeps low-confidence or risky outputs in a review path instead of treating every result as safe for blind writeback

## Current field coverage

The app currently classifies these primary fields:

- `assetType`
- `assetSubType`
- `schemaType`
- `product`
- `topic`
- `useCases`
- `industry`
- `companySize`
- `region`
- `language`
- `usageRights`
- `jobLevel`
- `jobFunction`
- `audience`
- `funnelStage`
- `competitivePositioning`
- `event`
- `eventType`
- `season`
- `yearPublished`

## Product shape

The app is structured as:

- a Contentful sidebar UI served from `public/app/sidebar.html`
- API routes under `api/` for classification, review, graph, feeds, analytics, health, and webhooks
- governed prompt, runtime policy, and normalization layers under `api/_shared`
- local scripts for setup, evaluation, taxonomy maintenance, trace capture, calibration, and replay
- replay, unit, and golden-dataset validation under `tests/` and `scripts/`

## Classifier design

The runtime combines five layers:

1. Deterministic signal extraction from slug, content type, structured headings, and metadata
2. Fact-stage classification for objective fields
3. Subjective-stage classification for audience-facing fields
4. Deterministic runtime policy normalization and consistency checks
5. Human corrections and review routing

The runtime is intentionally not described as fully deterministic end to end. Semantic fields are constrained by policy and evals, with repeatability checks and reviewer fallback for unstable cases.

## Review and governance

This app includes:

- governed classifier prompts
- governed runtime policy
- committed human-correction seeds
- deterministic replay checks
- golden signal checks
- repeatability harnesses for live no-cache reruns
- reviewer-facing reasoning snapshots that distinguish post-processing from human-corrected final values

## Local development

Install dependencies:

```bash
npm run install-ci
```

Run the local dev server:

```bash
npm start
```

Build the static app bundle:

```bash
npm run build
```

Run the main validation suites:

```bash
npm run test:unit
npm run test:routes
npm run test:classifier
npm run test:golden
```

## Required configuration

The app manifest currently expects an installation parameter:

- `appToken`: shared secret used by the sidebar app to authenticate API calls

The repository also includes `.env.example` documenting the broader runtime environment used for local development and deployment.

## Contentful manifest

The Contentful app manifest is included at:

- `contentful-app-manifest.json`

It currently points to the existing deployed sidebar URL so the current integration shape is visible during review. The Contentful team can replace the deployment target as part of the shared-hosting productization process.

## Repository notes for Contentful review

- This app directory is intentionally self-contained under `apps/content-graph-ai`
- No deploy script is included because deployment in `marketplace-partner-apps` is managed by the Contentful team
- The app includes documentation and evaluation artifacts because classifier behavior and governance are part of the product surface, not just implementation detail

## Important docs

- `docs/current/TAXONOMY_APP.md`
- `docs/current/HOW_THE_APP_WORKS.md`
- `docs/current/CLASSIFIER_LOGIC.md`
- `docs/current/CLASSIFIER_TOOL.md`
- `docs/current/CONTENTFUL_APP_MARKETPLACE_SUBMISSION.md`

## License

This app is released under the ISC license. See `LICENSE`.
