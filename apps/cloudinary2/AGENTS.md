# Agent Guide — cloudinary2

## What This App Does
Integrates Cloudinary Digital Asset Management with Contentful. Lets editors select, upload, and edit Cloudinary media assets (images and videos) from Contentful field editors. Includes an image editor and video editor dialog. Published as `@contentful/cloudinary-assets`.

## Archetype
Standard Vite app. The most feature-rich DAM integration in the repo — not a `dam-app-base` wrapper; it is a full custom implementation.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Cloudinary cloud name, API key/secret, presets |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field/index.tsx` | Custom field editor for one field/locale — single-asset picker flow (see User Flows) |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Entry-wide picker across every Cloudinary field/locale on the entry — multi-asset picker flow (see User Flows) |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | Dialog router — dispatches to the asset picker or an editor dialog based on `invocation.dialog` |
| `LOCATION_DIALOG` | `src/locations/AssetPickerDialog.tsx` | Asset selection dialog; internally routes between `SingleFieldDialog` and `MultiFieldDialog` based on `invocation.mode` |
| `LOCATION_DIALOG` | `src/locations/ImageEditorDialog.tsx` | In-app image transformation editor |
| `LOCATION_DIALOG` | `src/locations/VideoEditorDialog.tsx` | In-app video transformation editor |

## User Flows

Two distinct asset-selection flows share the same dialog component. They diverge in entry location, invocation params, and where selected assets get written back — this is the most common source of confusion when touching `AssetPickerDialog.tsx`.

### Single-asset flow (Field location)

- **Entry point:** `src/locations/Field/index.tsx` renders `AssetPickerButton` (`src/locations/Field/AssetPickerButton.tsx`) scoped to one field/locale.
- **Invocation:** `AssetPickerButton` calls `sdk.dialogs.openCurrentApp` with invocation params that do **not** set `mode` (optionally `expression`, derived from the field's `resourceType` instance parameter).
- **Dialog routing:** `AssetPickerDialog`'s router sees no `mode: 'multi-field'` and renders `SingleFieldDialog`, which opens the Cloudinary Media Library widget directly.
- **Result path:** the widget's `insertHandler` calls `sdk.close(data)` immediately — no slot bookkeeping. `AssetPickerButton` receives the `MediaLibraryResult`, maps it through `extractAsset`, and calls `onNewAssetsAdded`, which `Field/index.tsx` appends to the field's local array value via `useFieldValue`'s setter.
- **Scope:** exactly one (field, locale) pair per dialog open.

### Multi-asset flow (Sidebar location)

- **Entry point:** `src/locations/Sidebar.tsx`, registered at `LOCATION_ENTRY_SIDEBAR`. On mount it inspects the entry's editor interface + content type to find every (field, locale) pair using this app as its widget, and builds one `PickerSlot` per pair (see the `PickerSlot` interface in `Sidebar.tsx`).
- **Invocation:** `openMultiPicker` calls `sdk.dialogs.openCurrentApp` with `{ mode: 'multi-field', slots }`.
- **Dialog routing:** the router sees `mode === 'multi-field'` and renders `MultiFieldDialog` with the slot list. The Cloudinary widget opens once; a bottom toolbar lets the user switch which slot new picks get assigned to. Each `insertHandler` call assigns picked assets to the currently active slot (respecting that slot's `maxFiles`) and auto-advances to the next slot with remaining capacity.
- **Result path:** on "Add to entry," `sdk.close({ mode: 'multi-field', assignments })` returns assets keyed by `slotKey`. `Sidebar.tsx` then loops over every slot, merges each slot's new assets with `entryField.getValue(locale)`, and calls `entryField.setValue(merged, locale)` directly via `sdk.entry.fields` — this bypasses any mounted Field instance's local component state, relying on `useFieldValue`'s subscription to pick up the change.
- **Scope:** any number of (field, locale) pairs in one dialog open, across the whole entry.

### Shared surface / risk area

Both flows route through the same `AssetPickerDialog` component and the same Cloudinary Media Library widget options (cloud name, api key, transformations, `maxFiles`/`multiple`). A change to the shared widget `options` object, `extractAsset`, or the router's `mode` check affects both flows simultaneously — verify both `SingleFieldDialog` and `MultiFieldDialog` behavior when editing this file. See `src/locations/AssetPickerDialog.spec.tsx` for the regression coverage protecting this split.

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
