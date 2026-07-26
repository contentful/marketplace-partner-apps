# Docs Map

This repo separates documentation by purpose so current runtime docs do not get mixed with historical analysis.

## Folders

- `docs/current/` — current runtime behavior, interfaces, and operational docs engineers should trust first
- `docs/governance/` — policy, changelog, and review/governance materials
- `docs/evidence/` — saved live traces, smoke logs, and diagrams from verified runs
- `docs/historical/` — older analyses and research kept for context, not as the current contract
- `docs/plans/` — forward-looking hardening and implementation plans

## Start Here

- [`current/CURRENT_RUNTIME_FACTS.md`](./current/CURRENT_RUNTIME_FACTS.md)
- [`current/HOW_THE_APP_WORKS.md`](./current/HOW_THE_APP_WORKS.md)
- [`current/CLASSIFIER_LOGIC.md`](./current/CLASSIFIER_LOGIC.md)
- [`current/TAXONOMY_APP.md`](./current/TAXONOMY_APP.md)

## Notes

- Historical docs may describe behavior that has since changed. Treat `docs/current/` as the source of truth for the live app.
- `npm run docs:sync` regenerates the current runtime facts file.
- `npm run docs:check` fails when current-state docs drift from the runtime contract.
- `docs/evidence/LIVE_CLASSIFY_TRACE_LATEST.json` and `docs/evidence/LIVE_CLASSIFY_TRACE_LATEST.md` are refreshed by `.github/workflows/live-trace.yml` when classifier-pipeline changes land on `main`.
