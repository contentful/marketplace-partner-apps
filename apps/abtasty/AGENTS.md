# Agent Guide — abtasty

## What This App Does
Integrates AB Tasty (A/B testing and personalization platform) with Contentful. Lets editors connect Contentful entries to AB Tasty experiments and view experiment/variation data from within the entry editor.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure AB Tasty API credentials |
| `LOCATION_ENTRY_EDITOR` | `src/locations/EntryEditor.tsx` | Embedded experiment selector in the entry editor |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Sidebar panel showing linked experiment status |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |
| `contentful-management` | CMA for entry/content type reads |

## Source Layout

```
src/
├── App.tsx
├── locations/       # ConfigScreen, EntryEditor, Sidebar
├── components/
├── constants/
├── hooks/
├── queries/         # AB Tasty API query definitions
├── services/        # AB Tasty API client
└── utils/
```

## Sharp Edges & Invariants

- **AB Tasty API credentials** (client ID, access token) are in installation parameters — never log them.
- **`queries/`** and **`services/`**: all AB Tasty API calls should go through the service layer, not directly from components.
- The EntryEditor location embeds an experiment selector in the full entry editor view — it is not a field replacement. Do not confuse it with `LOCATION_ENTRY_FIELD`.
- Experiment linkage is stored as a JSON or Symbol field value — verify the storage format in `hooks/` before modifying.

## Never / Always

- **Never** call AB Tasty APIs directly from components — use `services/`.
- **Always** use `useAutoResizer()` in the Sidebar location.
