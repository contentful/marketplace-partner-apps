# Gate production deploys on release-please instead of a manual production branch

## Status

Accepted

## Context

Before December 2023, deploying an app to production required merging into a dedicated `production` branch from `main` on an ad hoc basis. This was prone to merge conflicts, and ran independently of `release-please` — adopted a month earlier as the source of truth for per-app versioning and changelogs — so versioning and deployment were two disconnected processes that had to be kept in sync by hand. Several now-stale branches on the remote (`production-merge-with-cloudinary`, `production-merge-bynder-fix`, `ceros-production-deploy`, `production-match-main`) are leftover evidence of that manual merge workflow.

## Decision

Retire the manual `production` branch and couple production deploys directly to `release-please`'s output. The `release-and-deploy.yml` GitHub Actions workflow:

- Runs `release-please` in manifest mode on every push to `main`.
- Deploys every changed app to **staging** on every push to `main`, regardless of release status.
- Deploys to **production** only when `release-please` reports `releases_created: true` — i.e. only immediately after a release-please PR is merged.

CircleCI's `apps-checks` job (build/lint/test on pull requests) was kept as-is; only the deploy step moved off CircleCI and off the branch-merge model.

## Consequences

### Positive

- A single release-please merge event now drives both changelog/version publication and production deployment — no separate manual step to keep the two in sync.
- Removes the merge-conflict-prone `production` branch workflow entirely.
- Staging deploys run continuously on every `main` push, giving faster feedback than the old branch-gated flow.

### Negative

- CI is now split across two providers: GitHub Actions owns release/deploy, CircleCI still owns pull-request checks. The repo is not fully off CircleCI, despite `ARCHITECTURE.md` describing GitHub Actions as "the" CI system.
- Several `production`-prefixed branches from the old workflow remain on the remote with no further purpose; cleanup was out of scope for this change.

### Neutral

- Every push to `main` now triggers a staging deploy of all changed apps, whether or not a release was created — a shift in deploy frequency, not scope.
