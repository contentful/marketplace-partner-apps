# ADR-0002: API Token + Secret Authentication Instead of OAuth

**Date:** 2026-08-17
**Status:** Accepted
**Deciders:** Shanon Place

## Context

Alchemer offers two authentication methods: `api_token` + `api_token_secret` query
parameters, and OAuth 1.0 (there is no OAuth 2.0 —
apihelp.alchemer.com/help/authentication, re-verified 2026-08-17). Alternatives:

1. **OAuth 1.0** — per-user scoped, so the survey list would depend on which user
   authorized; needs a callback endpoint hosted outside the Contentful iframe; its
   endpoints are not documented for the regional (EU/CA/AU) hosts.
2. **API token + secret as installation parameters** — account-scoped via a service
   user's key, no external callback, works on all regions.

## Decision

Use `api_token` + `api_token_secret`, stored as app installation parameters and attached
to requests server-side by the proxy function (ADR-0001).

## Consequences

### Positive

- Works identically across all four Alchemer regions; no external auth infrastructure.
- Survey visibility is governed by one deliberate service key, not by whoever clicked
  an OAuth consent screen.

### Negative

- Installation parameters are readable by users of the space; the config screen tells
  installers to use a least-privilege key under a service user.
- Key rotation invalidates the old key immediately; calls 401 until the config screen is
  re-saved.

### Neutral

- Credentials ride in the request query string (Alchemer's design), which is why the
  function never logs or echoes URLs unredacted.
