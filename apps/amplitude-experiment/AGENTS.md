# Agent Guide — amplitude-experiment

## What This App Does
Integrates Amplitude Experiment (feature flagging and A/B testing) with Contentful. Lets editors link Contentful entries to Amplitude experiments and view experiment status in the entry editor and sidebar.

## Archetype
Standard Vite app. Published as `amplitude-contentful`.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Amplitude API key and deployment key |
| `LOCATION_ENTRY_EDITOR` | `src/locations/EntryEditor.tsx` | Experiment selector embedded in the entry editor |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Shows linked experiment status |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |
| `contentful-management` | CMA for entry and content type reads |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, EntryEditor, Sidebar
├── components/
├── contexts/          # React context for Amplitude state
└── utils/
```

## Sharp Edges & Invariants

- **Amplitude API credentials** (API key, deployment key) are in installation parameters — never log them.
- **`contexts/`**: Amplitude state is managed via React context. If you add new Amplitude data, thread it through the existing context rather than creating parallel state.
- The EntryEditor location is not a field editor — it provides a supplementary panel in the full entry editor view.
- Experiment linkage storage format — check `src/locations/EntryEditor.tsx` for how the linked experiment ID is persisted.

## Never / Always

- **Never** log Amplitude API or deployment keys.
- **Always** use `useAutoResizer()` in the Sidebar location.
