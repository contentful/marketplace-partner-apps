# Agent Guide — xillio-transcreate

## What This App Does
Integrates Xillio Transcreate (professional translation and content adaptation service) with Contentful. Manages the full translation workflow — submitting entries, tracking job status, and importing completed translations. Published as `xillio-transcreate`.

## Archetype
Standard Vite app. One of the more fully-featured translation apps in the repo.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Xillio API credentials and project mappings |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar/` | Entry translation status and submission controls |
| `LOCATION_DIALOG` | `src/locations/Dialog/` | Translation job review and management dialog |
| `LOCATION_PAGE` | `src/locations/Page/` | Full-page translation job management |
| `LOCATION_*` | `src/locations/index/` | Index/routing module |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/f36-icons` | Icons |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |
| `contentful-management` | CMA |

## Source Layout

```
src/
├── App.tsx
├── appConfig.tsx          # App-level configuration constants
├── locations/             # ConfigScreen, Sidebar, Dialog, Page, index
├── api/                   # Xillio API client
├── assets/
├── components/
├── hooks/
├── providers/             # React context providers
├── styles.tsx
├── types/
└── utils/
```

## Sharp Edges & Invariants

- **Xillio API credentials** are in installation parameters — never log them.
- **`api/`**: all Xillio API calls go through this module.
- **`providers/`**: cross-location state is shared via React context providers. Add new shared state here rather than prop-drilling or creating parallel contexts.
- **Translation workflow** (similar to `smartling`, `translationstudio`): content serialization/deserialization is critical. Bugs corrupt translated entries. The serialization logic is in `utils/` or `api/`.
- **`appConfig.tsx`**: app-level constants live here — check before hardcoding any values in components.
- **`styles.tsx`**: uses a `.tsx` file for styles (likely CSS-in-JS or styled-components pattern). Follow this approach for new style additions.

## Never / Always

- **Never** log Xillio API credentials.
- **Never** make Xillio API calls outside `src/api/`.
- **Always** use `useAutoResizer()` in the Sidebar and Dialog locations.
- **Always** test content serialization/deserialization end-to-end after any changes to the translation pipeline.
