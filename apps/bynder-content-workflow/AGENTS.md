# Agent Guide — bynder-content-workflow

## What This App Does
Integrates Bynder's Content Workflow (formerly GatherContent) with Contentful. Manages structured content workflows — lets editors pull content from Bynder Content Workflow into Contentful rich-text and other fields, and sync content status between the two systems.

## Archetype
Standard Vite app. A more complex app than the standard DAM integration — it handles rich-text import/export.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Bynder Content Workflow API key and project mappings |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | Field-level import from Bynder Content Workflow |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Entry-level sync status and controls |
| `LOCATION_PAGE` | `src/locations/Page/` | Full-page content workflow management |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/field-editor-rich-text` | Embedded rich-text editor |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |
| `@contentful/rich-text-html-renderer` | Converts Contentful rich-text to HTML for Bynder |

## Source Layout

```
src/
├── App.tsx
├── locations/           # ConfigScreen, Field, Sidebar, Page
├── components/
├── context/             # React context for workflow state
├── hooks/
├── services/            # Bynder Content Workflow API client
├── type/                # TypeScript type definitions
└── utils/
```

## Sharp Edges & Invariants

- **Content format conversion**: content from Bynder Content Workflow must be converted into Contentful's rich-text Document node format on import, and vice versa on export. This conversion is the most critical and fragile part of the app — bugs here corrupt content.
- **Bynder Content Workflow API key** is in installation parameters — never log it.
- **`@contentful/field-editor-rich-text`** is embedded in the Field location — follow the same patterns as `rich-text-versioning` in `contentful/apps` for embedding this editor.
- **`context/`**: workflow state is threaded through React context — do not add ad-hoc component state for workflow data; update the context instead.
- **`appVersion`** directory: check here if the app has version-specific behavior or migration logic.

## Never / Always

- **Never** modify the content format conversion logic without testing end-to-end with an actual Bynder Content Workflow project.
- **Never** embed `field-editor-rich-text` outside the Field location without understanding its SDK context requirements.
- **Always** use `useAutoResizer()` in Field and Sidebar locations.
