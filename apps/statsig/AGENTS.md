# Agent Guide — statsig

## What This App Does
Integrates Statsig (feature flagging and experimentation platform) with Contentful. Lets editors link Contentful entries to Statsig feature gates and experiments, and control content rollout through Statsig's targeting rules.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Statsig Console API key |
| `LOCATION_ENTRY_EDITOR` | `src/locations/EntryEditor.tsx` | Entry-level feature gate/experiment selector |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/f36-tokens` | Design tokens |
| `@contentful/field-editor-reference` | Reference field editor (for linked content) |
| `@contentful/react-apps-toolkit` | `useSDK()` |
| `contentful-management` | CMA |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, EntryEditor
├── components/
├── constants.ts
├── helpers/
├── hooks/
└── services/          # Statsig Console API client
```

## Sharp Edges & Invariants

- **Statsig Console API key** is in installation parameters — never log it. This is the server-side API key for reading gate/experiment definitions — do not use the client-side SDK key for API calls.
- **`@contentful/field-editor-reference`** is used in the entry editor, likely for selecting content entries to associate with a feature gate.
- **`services/`**: all Statsig API calls go through this module.

## Never / Always

- **Never** log the Statsig Console API key.
- **Always** use `useAutoResizer()` if the EntryEditor has variable height content.
