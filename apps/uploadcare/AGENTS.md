# Agent Guide — uploadcare

## What This App Does
Integrates Uploadcare (file uploading and CDN) with Contentful. Lets editors upload files directly to Uploadcare from a custom field editor and stores the resulting Uploadcare CDN URLs in Contentful fields. Published as `uploadcare-contentful-app`.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Uploadcare public key and upload settings |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | Custom field editor — Uploadcare file uploader |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | Uploadcare file manager picker |

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
├── locations/           # ConfigScreen, Field, Dialog
├── assets/
├── components/
├── constants.ts
└── utils.ts
```

## Sharp Edges & Invariants

- **Uploadcare public key** (for uploads) is in installation parameters. The public key is safe to use in the browser — it only allows uploads to the configured project, not management operations.
- **Uploadcare secret key** must never be used in the browser — if any admin operations are needed, they must go through a backend.
- **Uploadcare Widget / File Uploader**: Uploadcare provides a JavaScript widget for file uploads. Check whether this app uses `@uploadcare/react-widget`, `@uploadcare/file-uploader`, or a custom implementation.
- **Stored value format**: stores Uploadcare file UUIDs or CDN URLs. Do not change the stored format without a migration strategy.

## Never / Always

- **Never** use the Uploadcare secret key in the browser.
- **Always** use `useAutoResizer()` in the Field location.
