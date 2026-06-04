# Agent Guide — lottie-preview

## What This App Does
Adds an animated Lottie file preview to Contentful JSON fields. When a JSON field contains a Lottie animation object, this app renders it as an animated preview in a custom field editor.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure which fields show the Lottie preview |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | Custom field editor with Lottie animation preview |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-components` | **Shared internal component library** (this repo's `packages/`) |
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/f36-icons` | Icons |
| `@contentful/f36-tokens` | Design tokens |
| `@contentful/field-editor-json` | Embedded JSON field editor |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, Field
├── assets/
├── components/        # Lottie animation renderer
└── types/
```

## Sharp Edges & Invariants

- **`@contentful/app-components`**: this app uses the shared internal package from `packages/contentful-app-components`. When modifying shared components, check if `lottie-preview` depends on the component being changed.
- **`@contentful/field-editor-json`** is embedded in the Field location alongside the Lottie preview. The field still stores raw JSON — the preview is display-only and does not modify the stored value.
- **Lottie renderer**: a Lottie player library (e.g. `lottie-web` or `@lottiefiles/react-lottie-player`) renders the animation. Check `package.json` for the specific library before modifying animation behavior.
- **Field type must be `Object` (JSON)** — this app only works on JSON fields.

## Never / Always

- **Never** modify the JSON field value in the Lottie preview — it is read-only display.
- **Always** use `useAutoResizer()` in the Field location.
