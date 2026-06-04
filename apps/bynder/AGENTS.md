# Agent Guide — bynder

## What This App Does
Integrates Bynder Digital Asset Management with Contentful. Lets editors select Bynder media assets for use in Contentful fields. Uses Bynder's Compact View SDK for the asset picker. Published as `@contentful/bynder-assets`.

## Archetype
Hybrid: **DAM base app** foundation with a custom **Sidebar** location. Not a pure `dam-app-base` wrapper — it extends the base with an additional sidebar panel.

## Structure

```
apps/bynder/
└── src/
    ├── main.tsx              # App entry
    ├── index.jsx             # dam-app-base setup + Bynder Compact View config
    ├── locations/
    │   └── Sidebar.tsx       # Custom sidebar (not provided by dam-app-base)
    └── logo.svg
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/dam-app-base` | Core DAM integration UI and CMA wiring |
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI (for Sidebar) |
| `@contentful/node-apps-toolkit` | Shared utilities |
| `@contentful/react-apps-toolkit` | `useSDK()` |

## Sharp Edges & Invariants

- **Bynder Compact View SDK**: Bynder's asset picker is loaded via a `<script>` tag pointing to Bynder's CDN (`bynder-compactview-5-latest.js`). This is a third-party script — CSP must allow it. The picker URL and version are defined as constants in `src/index.jsx`.
- **`FIELDS_TO_PERSIST`**: only the fields listed in this constant (from `src/utils/constants`) are stored in the Contentful field value. Changing this list changes the stored data schema — existing field data will have the old fields and missing new ones.
- **`transformAsset`**: in `src/utils/transformAsset.js` — converts Bynder asset objects to the format `dam-app-base` expects. Any changes to Bynder's asset API response shape require updating this transformer.
- **JSX in `src/index.jsx`** — the main entrypoint uses JSX, not TSX. The Sidebar is TSX. Don't mix them carelessly.
- Bynder's Compact View opens as a popup or modal — popup blockers can prevent it.

## Never / Always

- **Never** change `FIELDS_TO_PERSIST` without a data migration plan for existing stored values.
- **Never** change the Bynder SDK version (`bynder-compactview-5-latest.js`) without testing the full picker flow.
- **Always** update `transformAsset` when Bynder's asset response shape changes.
