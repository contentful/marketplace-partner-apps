# Current Runtime Facts

> GENERATED FILE. Do not edit manually.
> Update with `npm run docs:sync`.

## Install / Verification

- Local install command: `npm ci`
- Vercel install command: `npm ci`
- Classifier verification command: `npm run verify:classifier`
- Docs sync command: `npm run docs:sync`
- Docs check command: `npm run docs:check`

## Vercel Cron (from vercel.json)

- `0 8 * * *` → `/api/cron/update-graph`
- `30 8 * * *` → `/api/cron/process-classification-queue`

## Runtime Defaults

- Prompt version: `2026-04-02-evidence-v10`
- Fact-stage model default: `gemini-3.1-pro-preview`
- Subjective-stage model default: `gemini-2.5-flash-lite`
- Company search model default: `gemini-3.0-flash`
- Signal body-summary cap: `4000` chars

## Canonical Route Files

- Classify route: `api/tools/[tool]/execute.ts`
- Review route: `api/review/[action].ts`
- Cron route: `api/cron/[job].ts`
- Webhook route: `api/webhooks/contentful-classify.ts`

## Current Runtime Notes

- The sidebar route uses the real deep-crawl classifier path; it is not a synthetic smoke-test path.
- NLP enrichment and dynamic few-shot retrieval can still run on the interactive path when configured.
- Audience is left blank unless the content has explicit audience evidence.
- Historical / research docs may mention older behavior; use `docs/current/CLASSIFIER_LOGIC.md`, `docs/current/HOW_THE_APP_WORKS.md`, and this file for the current contract.

## Guardrails

- Pre-commit runs classifier governance plus docs governance checks.
- CI runs `npm run docs:check` before the governed classifier verification path.
- Current-state docs should not reference retired single-file route aliases; they should point to the canonical dynamic route files listed above.
