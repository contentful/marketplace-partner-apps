# Agent Guide — flexfields

## What This App Does
Provides a flexible, configurable entry editor that lets space admins define custom field layouts and conditional visibility rules. Editors see a customized entry editing experience based on the configuration. Published as `thrillworks-flex-fields-app`.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Define field layout configurations and visibility conditions |
| `LOCATION_ENTRY_EDITOR` | `src/locations/EntryEditor.tsx` | Renders the custom field layout with embedded field editors |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/default-field-editors` | All standard Contentful field editors (embeddable) |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/f36-layout` | Layout primitives |
| `@contentful/f36-multiselect` | Multi-select UI |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, EntryEditor
├── components/
├── types/             # TypeScript types for layout config
└── utils.ts
```

## Sharp Edges & Invariants

- **`@contentful/default-field-editors`**: this package bundles all standard field editors. It is a heavy dependency — importing it brings in many field editor packages at once. Do not add individual `@contentful/field-editor-*` packages alongside it.
- **Configuration schema** (defined in ConfigScreen, stored in installation params) is the backbone of the app. The EntryEditor reads this schema to determine which fields to show, in what order, and under what conditions. Any change to the config schema must be backwards-compatible with existing stored configs.
- **Entry editor replaces all fields**: this app completely replaces the standard Contentful entry editor. All field editing happens through the embedded `@contentful/default-field-editors` components. If a field type is not handled, it will not be editable.
- Conditional visibility rules are evaluated client-side on every field value change.

## Never / Always

- **Never** change the configuration schema in a backwards-incompatible way — existing installations will silently break.
- **Never** add individual `@contentful/field-editor-*` dependencies — `@contentful/default-field-editors` already includes them all.
