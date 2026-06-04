# Agent Guide — frontify

## What This App Does
Integrates Frontify (brand management and DAM platform) with Contentful. Lets editors select Frontify assets for use in Contentful fields.

## Archetype
**DAM base app** — thin wrapper around `@contentful/dam-app-base`. Published as `@contentful/frontify-assets`.

> This is a copy of the `frontify` app from `contentful/apps`, now maintained in this partner repo.

## Structure

```
apps/frontify/
└── src/
    ├── index.js      # Mounts dam-app-base with Frontify config
    └── logo.svg
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/dam-app-base` | Provides entire DAM integration UI |

## Sharp Edges & Invariants

- **All core logic in `dam-app-base`** — this is a configuration-only file (~50 lines).
- **JavaScript, not TypeScript**.
- **Frontify picker** is opened via Frontify's JavaScript SDK. Check `src/index.js` for how the SDK is initialized and the `openDialog` function is implemented.
- Frontify uses OAuth — the OAuth flow is handled by the Frontify SDK. Credentials are in installation parameters.
- **Sync with `contentful/apps` version**: if both repos have a `frontify` app, check which one is canonical and whether patches need to be applied to both.

## Never / Always

- **Never** bypass `dam-app-base` extension points.
- **Always** return assets in `dam-app-base` format.
