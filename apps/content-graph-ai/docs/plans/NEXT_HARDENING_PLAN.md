# AI Hardening Scorecard

This file is no longer a speculative next-step memo. It is the current scorecard for what the repo now proves, what remains data-limited, and what still sits outside full productization.

## What Is Now Proven In Repo

- Fast CI proves deterministic signal extraction, governed prompt/runtime boundaries, route auth behavior, committed classifier replay fixtures, and calibration artifact integrity.
- The classifier replay suite now runs against committed fixtures in `tests/classifier-fixtures.json` instead of only checking signal heuristics.
- Calibration integrity is now checked explicitly with `npm run check:classifier-artifacts`.
- Internal graph/feed/analytics/CRM read surfaces now require `CONTENT_GRAPH_APP_TOKEN`.
- Slack slash commands now require valid Slack request signatures and timestamp replay protection.
- Runtime config checks are shared through `api/_shared/utils/runtimeConfig.ts` instead of being fully ad hoc.

## Current Evidence Ladder

### Required CI

- `npm run test:unit`
- `npm run test:routes`
- `npm run test:classifier`
- `npm run test:golden`
- `npm run check:classifier-artifacts`

### Deeper Eval Workflow

Use `.github/workflows/classifier-evals.yml` for non-blocking evaluation artifacts:

- deterministic replay report
- calibration artifact report
- optional Phoenix evals when secrets are present
- optional judge-based review when Gemini credentials are present

## Current Data Reality

The code is harder than before; the data still needs to grow.

- committed classifier replay fixtures: `8`
- committed human correction seeds: `7`
- calibration overlap in the committed profile: `9`
- calibration integrity: valid
- calibration breadth: still below the sample size needed for strong data-backed confidence across all semantic fields

That means the repo now proves that the system is governed and regression-checked, but it does not yet prove broad production-grade accuracy across all important page types.

## Remaining High-Value Work

These are the real remaining gaps after the hardening pass:

1. Expand the reviewed correction set to `20-50` important entries across product, solution, docs, webinar, resource, and case-study content.
2. Re-run `npm run calibrate:confidence` once the reviewed set grows enough to materially improve coverage.
3. Re-run `npm run evaluate:phoenix` against the larger reviewed set.
4. Capture fresh live traces for representative page families and verify that the same drift reductions still hold.
5. Only add new runtime rules when the larger reviewed set shows repeatable failure patterns.

## Ship-Readiness Interpretation

### Strong now

- The system is not just prompt glue.
- Deterministic constraints, runtime policy, human overrides, and calibration checks are all real and testable.
- Internal surfaces are better protected and easier to review.

### Still not fully productized

- The deployment model is still effectively single-tenant.
- Confidence calibration is structurally implemented, but the reviewed dataset is still small.
- Phoenix and judge flows are now wired for artifacts, but they are still optional workflows, not mandatory release gates.

## Useful Commands

```bash
npm run verify:classifier
```

```bash
npm run check:classifier-artifacts
```

```bash
npm run evaluate:phoenix
```
