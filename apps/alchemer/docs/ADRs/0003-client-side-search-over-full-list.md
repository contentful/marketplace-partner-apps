# ADR-0003: Load the Full Survey List Once and Search Client-Side

**Date:** 2026-08-14
**Status:** Accepted
**Deciders:** Shanon Place

## Context

Editors need to find a survey by title. Alternatives:

1. **Server-side search per keystroke** — the v5 filter grammar has no substring
   operator (apihelp.alchemer.com/help/filters-v5), so "search" would mean scanning
   pages server-side; measured at seconds per keystroke through the app-action round
   trip (ADR-0001). Unusable.
2. **Load everything once, filter in memory** — pages of 50, streamed progressively
   with a progress bar, then instant filtering.

## Decision

The picker fetches all pages sequentially on open (capped at 10 pages / 500 surveys,
with a "showing the first 500" notice beyond that), renders progressively, and filters
titles in memory. Reopening the picker reuses the loaded list; Refresh re-fetches.

## Consequences

### Positive

- Filtering is instant; selection costs zero additional API calls.
- Progressive rendering makes large accounts usable while later pages stream in.

### Negative

- Accounts beyond the cap only expose their first 500 surveys to the picker (title
  filter still works within those).
- The survey list can be up to a minute stale (Alchemer caches identical GETs for 60 s).

### Neutral

- Alchemer folders cannot help findability: they are UI-only in the Alchemer web app,
  with no REST API v5 exposure.
