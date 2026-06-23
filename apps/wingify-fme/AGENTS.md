# Agent Guide — wingify-fme

## What This App Does
Integrates Wingify FME (Feature Management and Experimentation, formerly Wingify Feature Management and Experimentation) with Contentful. Lets editors link Contentful entries to Wingify feature flags and experiments, controlling content delivery based on Wingify targeting rules. Published as `wingify-fme`.

## Archetype
Standard Vite app. Uses **JSX, not TSX**.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.jsx` | Configure Wingify Account ID and API credentials |
| `LOCATION_ENTRY_EDITOR` | `src/locations/EntryEditor.jsx` | Feature flag/experiment selector in entry editor |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.jsx` | Sidebar showing linked Wingify flag status |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()` |
| `contentful-management` | CMA |

## Source Layout

```
src/
├── App.jsx               # JSX
├── locations/            # ConfigScreen, EntryEditor, Sidebar (.jsx files)
├── components/
├── modalComponents/      # Modal/dialog UI components
├── services/             # Wingify API client
└── utils.js
```

## Sharp Edges & Invariants

- **JSX, not TSX** — all source files are `.jsx` or `.js`. Do not add TypeScript without a migration plan.
- **Wingify credentials** (Account ID, API token) are in installation parameters — never log them.
- **`modalComponents/`**: separate from `components/` — this directory holds modal-specific UI. Follow the existing split when adding new modal content.
- **`services/`**: all Wingify API calls go through this module.

## Never / Always

- **Never** add TypeScript without a migration plan.
- **Never** log Wingify API credentials.
- **Always** use `useAutoResizer()` in the Sidebar location.
