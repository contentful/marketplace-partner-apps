# Agent Guide — cloudinary2

## What This App Does
Integrates Cloudinary Digital Asset Management with Contentful. Lets editors select, upload, and edit Cloudinary media assets (images and videos) from Contentful field editors. Includes an image editor and video editor dialog. Published as `@contentful/cloudinary-assets`.

## Archetype
Standard Vite app. The most feature-rich DAM integration in the repo — not a `dam-app-base` wrapper; it is a full custom implementation.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Cloudinary cloud name, API key/secret, presets |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | Custom field editor — asset picker and display |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | Main asset picker dialog |
| `LOCATION_DIALOG` | `src/locations/AssetPickerDialog.tsx` | Asset selection within the picker |
| `LOCATION_DIALOG` | `src/locations/ImageEditorDialog.tsx` | In-app image transformation editor |
| `LOCATION_DIALOG` | `src/locations/VideoEditorDialog.tsx` | In-app video transformation editor |

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
├── locations/             # ConfigScreen, Field, Dialog, AssetPickerDialog,
│                          # ImageEditorDialog, VideoEditorDialog, types/
├── components/
├── constants.ts
├── types.ts
└── utils.ts
```

## Sharp Edges & Invariants

- **Cloudinary Media Library widget**: the asset picker uses Cloudinary's JavaScript Media Library widget, loaded externally. CSP must allow Cloudinary's CDN. Check `src/constants.ts` for the widget URL.
- **Multiple dialog types**: this app has more than one dialog type. The dialog location `App.tsx` must discriminate between dialog types using `sdk.parameters.invocation` to render the correct dialog.
- **Image/video editors**: the ImageEditorDialog and VideoEditorDialog apply Cloudinary transformations (resize, crop, format conversion) and store transformation parameters alongside the asset URL. The stored value schema includes both the raw asset data and applied transformations.
- **Cloudinary API key/secret** are in installation parameters — the secret should only be used server-side. Verify whether this app makes any server-side Cloudinary API calls or relies purely on the Media Library widget (which uses unsigned upload presets for frontend-safe uploads).
- **Field value schema**: stores an array of Cloudinary asset objects. Do not change the schema without a migration plan.

## Never / Always

- **Never** expose the Cloudinary API secret in the frontend bundle.
- **Never** render dialog content without first checking `sdk.parameters.invocation.dialogType` — the wrong dialog type will render broken UI.
- **Always** use `useAutoResizer()` in Field and Dialog locations.
