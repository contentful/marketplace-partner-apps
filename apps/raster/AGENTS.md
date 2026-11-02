# Agent Guide — raster

## What This App Does
Integrates Raster (AI-powered image optimization and CDN) with Contentful. Lets editors select, upload, and manage Raster images from Contentful field editors, with AI-based optimization applied automatically. The dialog hosts `RasterPicker` from `@raster-app/react` (the Raster SDK), which handles sign-in, browsing, search, versions and uploads.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Optional organization pin and shared API key, checked with Raster on save |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | Custom field editor — Raster image picker and display |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | Raster's picker, and the selection to confirm |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-scripts` | Deploy tooling |
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/f36-icons` | Icons |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |
| `@raster-app/react` | Raster SDK: `RasterPicker`, client, image helpers |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, Field, Dialog
├── components/
├── lib/               # Raster SDK client, stored image shape
└── index.scss         # Global styles (note: .scss, not CSS modules)
```

## Sharp Edges & Invariants

- **Stored shape**: the field holds a JSON array of `Image` (`src/lib/types/image.ts`), built by `toImage`. Keep its keys: published entries and the sites reading them depend on them.
- **`lib/`**: the Raster client and its settings live here.
- **SCSS**: this app uses SCSS (`src/index.scss`) — if adding styles, continue using SCSS rather than CSS-in-JS or CSS modules.
- Raster API key is in installation parameters — never log it.

## Never / Always

- **Never** make Raster API calls outside `lib/`.
- **Always** use `useAutoResizer()` in Field and Dialog locations.
