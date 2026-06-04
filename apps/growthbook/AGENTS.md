# Agent Guide — growthbook

## What This App Does
Integrates GrowthBook (open-source feature flagging and A/B testing) with Contentful. Lets editors link Contentful entries to GrowthBook feature flags and experiments. Published as `growthbook-contentful-app`.

## Archetype
Standard Vite app. Non-standard source layout — no top-level `src/index.tsx` or `src/App.tsx` visible at scan time; organized into `contexts/`, `locations/`, `pages/`, `utils/`.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure GrowthBook API host and secret key |
| `LOCATION_ENTRY_EDITOR` | `src/locations/EntryEditor.tsx` | Entry-level feature flag selector |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Sidebar showing linked flag status |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()` |

## Source Layout

```
src/
├── contexts/          # React context for GrowthBook state
├── locations/         # ConfigScreen, EntryEditor, Sidebar
├── pages/             # Page-level components
└── utils/
```

## Sharp Edges & Invariants

- **GrowthBook secret key** is in installation parameters — never log it.
- **`pages/` directory**: separate from `locations/` — check how these are used in the router before adding new views.
- GrowthBook's self-hosted vs. cloud API endpoint is configurable — the host URL is in installation parameters, not hardcoded.

## Never / Always

- **Never** log the GrowthBook secret key.
- **Always** support both self-hosted and cloud GrowthBook deployments (host URL from installation params).
