# Agent Guide — adapt-essentials-asset-fields

## What This App Does
Enhances Contentful asset fields with additional metadata management capabilities. Provides a page-level UI for bulk management of asset field data across a space.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure which asset fields and content types are managed |
| `LOCATION_PAGE` | `src/locations/Page/` | Full-page asset field management interface |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/f36-image` | Image display component |
| `@contentful/f36-layout` | Layout primitives |
| `@contentful/react-apps-toolkit` | `useSDK()` |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, Page
├── assets/            # Static assets
└── components/
```

## Sharp Edges & Invariants

- **Page-only interaction**: all bulk operations happen in the Page location. The app does not embed in individual entry editors or fields.
- The Page location may make many CMA calls when operating on a large space — ensure operations are batched and paginated.
- `@contentful/f36-image` is used for asset thumbnail rendering — use it instead of plain `<img>` tags for consistent sizing and lazy loading.

## Never / Always

- **Never** perform unbounded CMA queries in the Page location — always paginate.
- **Always** call `sdk.app.setReady()` after async initialization in ConfigScreen.
