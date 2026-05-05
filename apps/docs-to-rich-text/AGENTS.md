# Agent Guide — docs-to-rich-text

## What This App Does
Converts documents (Google Docs, Word, etc.) into Contentful rich-text fields. A field-level app that embeds a document import button alongside the rich-text editor, letting editors paste or upload a document and have it converted to a Contentful Document node.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure document sources and conversion options |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | Augmented rich-text field with import controls |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/field-editor-rich-text` | Embedded standard rich-text editor |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |
| `contentful-management` | CMA |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, Field
├── api/               # Document conversion API client
├── assets/
├── components/
└── utils/
```

## Sharp Edges & Invariants

- **Document conversion**: the conversion from document format to Contentful rich-text Document nodes is the core logic. It lives in `src/api/` and/or `src/utils/`. Bugs here corrupt field content.
- **`@contentful/field-editor-rich-text`** is embedded in the Field location — the import action writes to the underlying field value via `sdk.field.setValue()`. After writing, the embedded editor must re-read the value — test this flow carefully after any changes.
- **Field type must be `RichText`** — this app only works on rich-text fields. If installed on a wrong field type, `sdk.field.setValue()` will reject the Document value.
- `src/api/` may call an external conversion service — check whether external API credentials are required (installation parameters).

## Never / Always

- **Never** write a non-Document value to the rich-text field.
- **Always** use `useAutoResizer()` in the Field location.
- **Always** test the full import → editor-refresh cycle after changes to the conversion logic.
