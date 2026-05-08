# Agent Guide — eppo

## What This App Does
Integrates Eppo (feature flagging and experimentation platform) with Contentful. Lets editors link Contentful entries to Eppo feature flags and experiments, enabling content-driven experimentation. Published as `eppo-contentful-app`.

## Archetype
Standard Vite app. One of the most location-rich apps in this repo.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Eppo SDK key |
| `LOCATION_HOME` | `src/locations/Home/` | Home screen widget |
| `LOCATION_PAGE` | `src/locations/Page/` | Full-page experiment management |
| `LOCATION_ENTRY_EDITOR` | `src/locations/EntryEditor/` | Entry-level experiment selector |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar/` | Sidebar showing linked experiment status |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field/` | Field-level experiment association |
| `LOCATION_DIALOG` | `src/locations/Dialog/` | Experiment selection dialog |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/f36-core` | Forma 36 core utilities |
| `@contentful/f36-icons` | Icons |
| `@contentful/f36-popover` | Popover components |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |

## Source Layout

```
src/
├── App.tsx
├── locations/         # All 7 locations above
├── components/
├── constants.ts
├── helpers/
├── hooks/
└── services/          # Eppo API client
```

## Sharp Edges & Invariants

- **Eppo SDK key** is in installation parameters — never log it.
- **7 locations** — verify which locations are actually installed and used before modifying all of them. The Home, Page, and Dialog locations may have separate installation requirements.
- **`services/`**: all Eppo API calls go through the service layer.
- **`@contentful/f36-popover`** is used — this is a less common F36 package. Check its API before modifying popover interactions.

## Never / Always

- **Never** log the Eppo SDK key.
- **Always** use `useAutoResizer()` in Field, Sidebar, and Dialog locations.
- **Always** check `sdk.parameters.invocation` in Dialog to determine which dialog variant to render.
