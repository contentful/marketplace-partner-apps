# Agent Guide — raster

## What This App Does
Integrates Raster (AI-powered image optimization and CDN) with Contentful. Lets editors select, upload, and manage Raster images from Contentful field editors, with AI-based optimization applied automatically.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Raster API key and project settings |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | Custom field editor — Raster image picker and display |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | Raster image library browser |
| `LOCATION_DIALOG` | `src/locations/ImageVersions.tsx` | View and select image versions/variants |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-scripts` | Deploy tooling |
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/f36-icons` | Icons |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, Field, Dialog, ImageVersions
├── components/
├── lib/               # Raster API client
└── index.scss         # Global styles (note: .scss, not CSS modules)
```

## Sharp Edges & Invariants

- **Multiple dialog types**: the app has two dialog-related locations (`Dialog`, `ImageVersions`). Check `sdk.parameters.invocation` in App.tsx to determine which dialog is being opened.
- **`lib/`**: all Raster API calls go through this module.
- **SCSS**: this app uses SCSS (`src/index.scss`) — if adding styles, continue using SCSS rather than CSS-in-JS or CSS modules.
- Raster API key is in installation parameters — never log it.

## Never / Always

- **Never** make Raster API calls outside `lib/`.
- **Always** check `sdk.parameters.invocation` to determine dialog type.
- **Always** use `useAutoResizer()` in Field and Dialog locations.
