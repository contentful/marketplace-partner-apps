# Agent Guide — imagekit

## What This App Does
Integrates ImageKit (image CDN and DAM) with Contentful. Lets editors select and manage ImageKit media assets from Contentful field editors. Published as `imagekit-contentful`.

## Archetype
Hybrid: uses `@contentful/dam-app-base` but also implements custom `Configuration`, `Dialog`, and `Field` locations directly — not a pure DAM base wrapper.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `src/locations/Configuration` | Configuration screen | Configure ImageKit URL endpoint and credentials |
| `src/locations/Dialog` | Asset picker dialog | ImageKit Media Library picker |
| `src/locations/Field` | Custom field editor | Asset display and edit controls |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/dam-app-base` | DAM integration base |
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()` |

## Source Layout

```
src/
├── App.tsx
├── locations/         # Configuration, Dialog, Field
├── constants.ts
└── types/
```

## Sharp Edges & Invariants

- **ImageKit Media Library widget**: ImageKit provides a JavaScript widget for the asset picker (similar to Cloudinary's Media Library). Check `src/locations/Dialog` for how the widget is initialized — it loads from ImageKit's CDN.
- **`dam-app-base` is a partial dependency**: unlike pure DAM base apps (frontify, dropbox), this app has its own custom locations. The base library may only be used for specific utilities — inspect `src/App.tsx` to understand the split.
- **A `CONTRIBUTING.md` already exists** in this app's directory — read it before making changes, as it may document partner-specific conventions.
- ImageKit URL endpoint and private key are in installation parameters — the private key should not be exposed to the browser.

## Never / Always

- **Never** expose the ImageKit private key in the frontend bundle.
- **Always** read the existing `CONTRIBUTING.md` in this app directory before contributing.
