# ADR-0001: App Function as a Read-Only Proxy for the Alchemer API

**Date:** 2026-08-13
**Status:** Accepted
**Deciders:** Shanon Place

## Context

The field editor needs to list and fetch surveys from the Alchemer REST API v5. The API
does not send CORS headers, so the browser cannot call it from the Contentful iframe.
Alternatives considered:

1. **Direct browser calls** — impossible (CORS), and would require handing the Alchemer
   credentials to the browser.
2. **An externally hosted proxy (lambda/server)** — works, but adds infrastructure the
   app consumer must deploy, secure, and pay for, and a second place credentials live.
3. **A Contentful App Function exposed as an App Action** — runs on Contentful's
   infrastructure, reads credentials server-side from installation parameters, needs no
   external hosting, and its egress is platform-restricted via `allowNetworks`.

## Decision

One app function (`alchemerProxy`) exposed through one app action (`alchemerApi`),
supporting exactly three read-only operations: `listSurveys`, `getSurvey`,
`testConnection`. The function refuses API hosts outside the four documented Alchemer
regional domains, because the host is editor-visible configuration and an arbitrary host
would turn the function into a credential-leaking open proxy. Fetch errors and request
URLs are never echoed verbatim — the credentials ride in the URL query string.

## Consequences

### Positive

- No external infrastructure; credentials never reach the browser.
- Egress is double-restricted (manifest `allowNetworks` + in-function allowlist).

### Negative

- Every call pays the CMA app-action create/poll protocol: seconds per round trip. This
  drove ADR-0003 (load-all + client-side search).
- The function's execution window is too tight for retry sleeps. This drove ADR-0004.

### Neutral

- The field editor is inert until the function bundle is uploaded and the action exists;
  local dev serves only the frontend.
