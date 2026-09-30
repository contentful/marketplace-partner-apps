# ADR-001: Three-Companion Governance Model

## Status

Accepted

## Context

AI-powered classification logic changes silently. A prompt tweak or model switch can degrade accuracy without any test failing. We needed a mechanism to ensure every behavioral change is deliberate, documented, and validated.

## Decision

Every AI runtime change must travel with three companions:

1. **Policy** — Versioned config in `config/classifierPolicy.ts` (bump version)
2. **Documentation** — Current-state docs in `docs/current/` updated to reflect the change
3. **Evaluation** — Test fixtures, golden datasets, or calibration artifacts updated

The pre-commit hook in `.githooks/pre-commit` enforces this locally. CI enforces it on PRs via `npm run verify:classifier`.

## Consequences

### Positive

- Prompt changes can't silently degrade accuracy
- Every behavior change has an audit trail in `docs/governance/CHANGELOG.md`
- New engineers immediately understand what's tested vs assumed

### Negative

- Small changes require touching 3+ files (policy + docs + tests)
- Initial setup cost for governance scripts

### Neutral

- `--no-verify` escape hatch exists for non-AI changes (README typos, etc.)
