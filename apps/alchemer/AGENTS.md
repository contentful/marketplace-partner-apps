# Agent Guide — alchemer

## What This App Does

Lets editors pick an Alchemer survey inside a JSON (Object) entry field: a searchable
picker with status badges, an inline survey preview, and a deep link to the Alchemer
builder. The selection is stored as a small descriptor (`SavedSurvey`) in the field; the
delivery side embeds the survey from the descriptor's share `url`.

The README is written for an external audience (Alchemer and its customers) and is the
authoritative run-book for setup, deployment, caveats and the local harnesses. Read it
before changing behavior. `functions/README.md` documents the proxy's dispatch, error
ladder and logging rules. Keep both in sync with any behavior change in the same edit.

## Archetype

Standard Vite app + one App Function exposed as an App Action. No lambda, no external
hosting.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Alchemer API token, secret and region as installation parameters; "Test connection" button |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | The survey picker, selected-survey card, previews and stale-survey warning (JSON Object fields only) |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | Location detection, field access, app action calls via `sdk.cma` |
| `@contentful/react-apps-toolkit` | `useSDK`, `SDKProvider` |
| `@contentful/f36-components` / `f36-tokens` | All UI |
| `@contentful/node-apps-toolkit` | Typed handler signature for the app function |
| `emotion` | The few `css()` styles Forma 36 has no component for |

## Source Layout

```
functions/
├── alchemerProxy.ts        # app function: listSurveys / getSurvey / testConnection
├── alchemerProxy.spec.ts   # security invariants (redaction, host allowlist, return shape)
├── README.md               # dispatch, error ladder, logging rules
└── tsconfig.json           # functions build independently from src/
src/
├── App.tsx                 # location router
├── index.tsx               # bootstrap
├── lib/alchemer.ts         # callAlchemer(), SavedSurvey, parseSavedSurvey, safeAlchemerUrl
├── locations/              # ConfigScreen.tsx, Field.tsx (+ *.spec.tsx alongside)
└── setupTests.ts           # jest-dom matchers, data-test-id
test/mocks/                 # mockSdk / mockCma for component specs
scripts/                    # local harnesses that call the live Alchemer API
docs/ADRs/                  # architectural decision records
```

## Commands

```bash
npm run test:ci                                    # vitest single run (CI)
npm test                                           # vitest watch mode
npx vitest run functions/alchemerProxy.spec.ts     # one spec file
npm run lint                                       # eslint, zero warnings allowed
npm run typecheck                                  # tsc for src/ and functions/ (two tsconfigs)
npm run build                                      # typecheck, vite build -> build/, build-functions -> build/functions/
npm start                                          # vite dev server on http://localhost:3000 (frontend only)
```

Deploying manually needs `.env` with `CONTENTFUL_ORG_ID`, `CONTENTFUL_APP_DEF_ID`,
`CONTENTFUL_ACCESS_TOKEN` (template in `.env.example`; never fall back to another
credential source):

```bash
npm run build && npm run upload-ci     # bundle frontend + function, activate
npm run upsert-actions                 # (re)create the alchemerApi action from the manifest
```

Local harnesses that call the live Alchemer API read `ALCHEMER_API_TOKEN`,
`ALCHEMER_API_TOKEN_SECRET` and optional `ALCHEMER_API_HOST` from `.env` via
`scripts/lib/env.mts`. They need Node 22.18+ for type stripping; CI never runs them.

```bash
npm run test:proxy -- testConnection
npm run test:proxy -- listSurveys 1
npm run test:proxy -- getSurvey 1234567
npm run bench:alchemer
```

## Sharp Edges & Invariants

- **Every API call is a four-hop async round trip** (iframe -> CMA app action call ->
  function -> Alchemer, then the CMA is polled for the result inside
  `sdk.cma.appActionCall.createWithResponse`). Each hop costs seconds. The picker therefore
  loads the whole list once when opened (pages of 50, capped at `MAX_PAGES` = 10 / 500
  surveys in `Field.tsx`) and filters titles in memory. Do not add a server-side search:
  the v5 filter grammar has no substring operator, and a function-side scan was tried and
  was unusably slow (see `functions/README.md` and ADR-0003).
- **The Alchemer API sends no CORS headers**: every call goes through the `alchemerProxy`
  function via the `alchemerApi` app action. Never fetch Alchemer from the browser.
- **The function runs in Contentful's sandbox, not Node.** Only global `fetch` exists for
  outbound I/O; `http`/`https` do not. Any dependency added to `functions/` must use
  `fetch`.
- **The proxy is read-only and closed**: only the three GET operations exist. A stored
  `apiHost` not on `ALLOWED_HOSTS` is refused with an error, never swapped for the
  default; an absent host means the US default.
- **Credentials ride in the Alchemer request query string**: URLs are only logged via
  `redactedUrl`, every Alchemer `message` passes through `redactSecrets`, and raw fetch
  errors are never echoed. `functions/alchemerProxy.spec.ts` covers these.
- **Return shape is always** `{ ok: true, ... }` or `{ ok: false, error, notFound?,
  rateLimited? }`. The frontend re-validates it and treats a thrown CMA error as "proxy not
  installed", so return errors, do not throw.
- **Two builds, deliberate duplication.** `functions/` is excluded from the root tsconfig
  and has its own; the two trees never import each other. `AlchemerResult`,
  `SurveySummary` and `AlchemerRequest` exist as a copy in `src/lib/alchemer.ts` and again
  in `functions/alchemerProxy.ts`. Change both.
- **Lists that must stay in sync by hand:**
  - Allowed Alchemer hosts: `ALLOWED_HOSTS` in `functions/alchemerProxy.ts`,
    `allowNetworks` in `contentful-app-manifest.json`, and the region options in
    `ConfigScreen.tsx`.
  - Link/preview domain allowlist: `ALCHEMER_LINK_DOMAINS` in `src/lib/alchemer.ts` (base
    domains, subdomains allowed) must cover the same regions as `ALLOWED_HOSTS`.
  - Action id `alchemerApi`: `APP_ACTION_ID` in `src/lib/alchemer.ts` and the manifest.
  - Action parameter schema in the manifest vs `AlchemerActionParameters` in the function.
    Contentful validates the payload against the manifest before invoking the function and
    rejects explicit `undefined`/`null`, which is why `callAlchemer` strips empty params.
    Manifest changes only take effect after `npm run upsert-actions`.
- **The stored field value is untrusted input.** `Field.tsx` runs it through
  `parseSavedSurvey` and renders `url`/`editUrl` only when `safeAlchemerUrl` accepts them
  (https on an Alchemer domain); both preview iframes are sandboxed. Never put a stored or
  API-provided URL into `href`/`src` without that check. Changing `SavedSurvey` is a
  content-level change for existing entries; only `url` is consumed on the delivery side.
- **Rate limits are account-wide** (240/min plus a 429 for identical in-flight requests)
  and Alchemer caches identical GETs for 60 s. The picker retries a 429'd page twice,
  20 s apart (`RATE_LIMIT_RETRIES` / `RATE_LIMIT_RETRY_DELAY_MS` in `Field.tsx`); a failed
  first page is deliberately not retried automatically (ADR-0004). Keep retry loops out of
  the function; its execution window is too tight to sleep in.
- **Two titles**: Alchemer surveys have `title` and `internal_title`; the proxy prefers
  `internal_title` so the picker matches the name shown in Alchemer's own list.
- **Alchemer folders are not exposed by the v5 API**; do not try to show them.
- **Forma 36 has no progress bar component**; `LoadProgressBar` in `Field.tsx` is
  hand-rolled.
- **`overrides` in package.json pins `@contentful/app-sdk`'s nested `contentful-management` to
  12.18.0.** From 12.18.1 that package pulls `contentful-sdk-core` 10, which declares
  `node >= 22`, and the marketplace-partner-apps CI runs Node 20 with `engine-strict`, so
  `npm ci` fails with EBADENGINE (seen on the first PR run, 2026-11-16). Drop the override
  only once that CI is on Node 22. Reproduce locally with `nvm use 20` and
  `npm ci --engine-strict`.
- **App action calls are scoped to an installation**: they 404 until the app is installed
  in the target environment, and run against that environment's saved credentials. The
  field editor and "Test connection" do nothing useful until the function bundle is
  uploaded and the action exists, even when the frontend runs locally.

## Testing Conventions

- Vitest with jsdom and globals; `src/setupTests.ts` sets `testIdAttribute: 'data-test-id'`.
- Component specs mock `@contentful/react-apps-toolkit` and use `test/mocks/mockSdk.ts`.
  `mockSdk.field.type` must stay `'Object'` or `Field` renders the misconfiguration note
  instead of the picker.
- The function spec stubs global `fetch` with `vi.stubGlobal` and asserts on
  `console.log` output for redaction.
- The live harness (`scripts/test-proxy.mts`) is the integration check; it bypasses
  manifest validation and `allowNetworks`, so it cannot prove the deployed wiring works.
  Use the curl recipe in the README for that.
- `tsc` runs as part of `npm run build`; vite and vitest never type-check on their own.

## Never / Always

- **Never** proxy arbitrary paths or hosts through the function.
- **Never** log or return the raw request URL or fetch error text.
- **Never** call the Alchemer API per keystroke; search stays client-side.
- **Never** commit `.env`; `.env.example` is the template and has no real values.
- **Always** treat survey `status` case-insensitively (Alchemer capitalizes it).
- **Always** return `{ ok: false, error }` from the function instead of throwing.
- **Always** update README.md, `functions/README.md` and this file in the same change as
  any behavior, parameter or tooling change.
- No emojis anywhere; inline comments should explain reasoning and constraints (the
  existing code does this heavily; match it).
