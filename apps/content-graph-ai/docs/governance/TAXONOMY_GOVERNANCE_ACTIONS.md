# Taxonomy Governance Actions

> Status: governance backlog and source-notes summary, not the authoritative current runtime behavior.

Source inputs:
- [`Bulent _ Zuhur - Taxonomy Ai Followup's transcript.txt`](/Users/zuhur.ahmed/Downloads/Bulent%20_%20Zuhur%20-%20Taxonomy%20Ai%20Followup's%20transcript.txt)
- [`BULENT_TRANSCRIPT_POLICY_NOTES.md`](./BULENT_TRANSCRIPT_POLICY_NOTES.md)
- [`Contentful - Tagging Taxonomy & Permissions Workbook.xlsx`](/Users/zuhur.ahmed/Downloads/Contentful%20-%20Tagging%20Taxonomy%20%26%20Permissions%20Workbook.xlsx)

This document separates:
- classifier policy we can enforce now
- upstream taxonomy decisions that need owner approval
- open questions that should be escalated to specific people

## 2026-03-23 Runtime Governance Hardening

- Added the repo health endpoint contract at `api/health.ts` and the `/health` rewrite used by uptime monitors.
- Added shared runtime hardening helpers for structured logging, rate limiting, cost tracking, and retriable vendor-failure detection.
- Tightened Postgres TLS defaults so non-local connections verify server certificates by default.
- Recorded the governance template ADR/workflow additions alongside these runtime changes so the repo keeps a documented audit trail instead of relying on CI behavior alone.

## 2026-03-24 Classifier Reasoning Contract + Bulk Runtime Plan

- Tightened the subjective-stage prompt so reasoning must be concise and field-by-field, instead of drifting into long mixed paragraphs.
- Bumped the default classifier prompt version to `2026-03-24-chain-v5` so fresh runs do not reuse the older reasoning contract.
- Added deterministic regression checks to ensure the prompt still requires exact per-field coverage and concise output.
- Recorded a bulk-classification performance plan that prioritizes crawl/classify concurrency separation, cheaper fact-stage routing, and earlier skip paths for repeat runs.

## Current Canonical Workbook State

Use the workbook as the source of truth for what exists today.

Already present in the workbook:
- `Personalization` as a topic
- `Web Development` as a topic
- `Migration & Replatforming` as a topic
- `Personalization` as a use case
- `Omnichannel`, `Websites`, and `Digital experiences`
- `Studio` as a legacy product value
- `Ninetailed (Personalization)` as the current personalization product value

Not currently present in the workbook:
- `General business`
- `Migration & Replatforming` as a use case
- `Analytics` as a product

## Classifier Rules To Keep

- Do not default broad educational content to `Software, IT & Technology`.
- For broad non-vertical content, use the approved broad industry label if desired, otherwise leave `industry` blank.
- Do not infer `companySize` from logo mentions on broad educational content.
- Use `companySize` only when strong context supports it; otherwise leave it blank.
- Keep broad SEO pillars as `Awareness (TOFU)`.
- Keep broad SEO pillars as `Article` by default.
- Use `TechArticle` only for implementation-heavy, reference, or documentation-style content.
- Keep `jobLevel` unset on broad SEO pillars unless the page explicitly targets a seniority band.
- Keep product tagging tight:
  - API learning content -> `Platform`
  - `Studio` -> `Platform`
  - `Analytics` as a product is a future-state rule until the workbook is updated
  - `Personalization` only when the page is actually about personalization or experimentation
- Allow multi-select only when values are genuinely central, especially for `useCases` and some `audience` cases.
- Keep `Digital experiences`, `Omnichannel`, and `Websites` as distinct concepts.
- Keep `Personalization` and `Web Development` aligned to the workbook topics.

## Decisions Already Made

- `book a demo` is a sales CTA, not an asset sub-type by itself.
- `Studio` should not be used as a standalone product tag and should map to `Platform`.
- `Analytics` should remain a distinct product when it is added upstream.
- API and TypeScript learning content about Contentful should map to `Platform`.
- Product-level `Personalization` should only be used when the page is specifically about the personalization product area.
- `Digital experiences`, `Omnichannel`, and `Websites` should remain separate.

## Upstream Taxonomy Decisions Needed

- Decide whether broad non-vertical content should use `General business` or blank `industry`.
- Merge overlapping developer-related job-function buckets:
  - `Developers`
  - `Web Development`
  - any adjacent engineering label that duplicates them
- Audit and retire stale topics that are no longer useful.
- Add or approve missing themes, especially:
  - `Migration & Replatforming` as a use case
- Add `Analytics` as a canonical product when that launch taxonomy is ready.
- Remove deprecated `Studio` as an active standalone product concept everywhere upstream if it still exists.
- Review whether current audience/persona lists are too outdated to support reliable personalization.

## Escalations

### Maria

- Distinction between `eBook` and `Report`
- Distinction for `One pager`
- Some funnel-stage and seniority mapping questions

### Cynthia

- Webinar classification distinctions

### Anne / Susie / Taxonomy Owners

- Missing topics
- Missing use cases
- Retirement of stale taxonomy values
- Merging overlapping taxonomy concepts
- Canonical addition/use of `Migration & Replatforming` as a use case
- Canonical addition of `Analytics` as a product

### Product / Taxonomy Owners

- Final product taxonomy ownership
- Final handling of deprecated `Studio`

## Recommended Next Governance Sequence

1. Lock broad-field policy:
   - `industry`: `General business` or blank
   - `audience`: leave blank unless the content explicitly targets a real audience group
2. Merge duplicate developer/persona buckets.
3. Approve `Migration & Replatforming` as a use case.
4. Add `Analytics` as a product when the launch taxonomy is finalized.
5. Remove deprecated product concepts like `Studio` upstream.
6. Refresh examples and golden data after taxonomy decisions are finalized.
