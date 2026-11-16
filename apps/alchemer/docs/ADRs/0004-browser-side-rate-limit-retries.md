# ADR-0004: Retry Alchemer 429s in the Browser, Not in the Function

**Date:** 2026-08-17
**Status:** Accepted
**Deciders:** Shanon Place

## Context

Alchemer rate limits are account-wide: 240 requests/minute shared across every API
consumer (apihelp.alchemer.com/help/api-request-limits), plus a separate 429 when an
identical request is already in flight — which two editors opening the picker at the same
time can trigger. Both clear within about a minute. Alternatives:

1. **Retry inside the app function** — the function's execution window is too tight to
   sleep 20 seconds between attempts.
2. **Fail the whole load on a 429** — discards pages already loaded and makes concurrent
   editors fight each other.
3. **Flag 429s from the function and retry the failed page in the browser** — the
   frontend can wait as long as it likes and keep already-loaded pages visible.

## Decision

The function maps HTTP 429 to `{ ok: false, rateLimited: true }` (logging Alchemer's
`X-SG-Warning` header and 429 body message). `Field.tsx` retries the failed page in
place — 2 retries, 20 seconds apart — while showing a "rate limit reached; retrying"
notice and keeping loaded pages interactive.

## Consequences

### Positive

- A partially loaded picker survives a shared-budget spike instead of starting over.
- The retry policy lives where waiting is free (the browser).

### Negative

- A sustained limit (other account consumers hogging the budget) still fails after the
  retries; the error note says the limit is account-wide.

### Neutral

- The in-flight-duplicate 429 could not be reproduced on a small test account; that
  branch is verified by review and unit tests, not live traffic.
