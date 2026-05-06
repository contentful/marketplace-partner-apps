# Agent Guide — livestory

## What This App Does
Integrates LiveStory (content experience platform) with Contentful. Lets editors embed LiveStory experiences in Contentful entries via the entry editor, similar to the Ceros integration. Published as `ls-contentful-app`.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure LiveStory account settings |
| `LOCATION_ENTRY_EDITOR` | `src/locations/EntryEditor.tsx` | Embed LiveStory experience URL and preview |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()` |
| `contentful-management` | CMA |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, EntryEditor
├── assets/
├── config.ts          # LiveStory API constants
├── styles.ts
└── util.ts
```

## Sharp Edges & Invariants

- Very similar structure to the `ceros` app — both embed a third-party experience URL in the EntryEditor location with a preview.
- **LiveStory credentials** are in installation parameters.
- The EntryEditor replaces the full entry editor — there is no field-level embedding.
- `src/config.ts` contains LiveStory API base URLs and constants.

## Never / Always

- **Never** log LiveStory credentials.
- **Always** validate the LiveStory experience URL format before writing to the entry.
