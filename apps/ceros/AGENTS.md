# Agent Guide — ceros

## What This App Does
Integrates Ceros (interactive content creation platform) with Contentful. Lets editors embed Ceros experiences in Contentful entries by entering or selecting a Ceros experience URL, with an oEmbed preview in the entry editor.

## Archetype
Standard Vite app. Published as `ceros-contentful-app`.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Ceros account settings |
| `LOCATION_ENTRY_EDITOR` | `src/locations/EntryEditor.tsx` | Embed Ceros experience URL and oEmbed preview |

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
├── config.ts          # Ceros API/oEmbed config
├── oembed.ts          # oEmbed fetching logic
├── styles.ts
└── util.ts
```

## Sharp Edges & Invariants

- **oEmbed**: Ceros experience previews are rendered via oEmbed (`src/oembed.ts`). The oEmbed endpoint is in `src/config.ts`. oEmbed responses are HTML strings — render them in a sandboxed `<iframe>` using `srcdoc`, not via `dangerouslySetInnerHTML`.
- **Stored value**: the entry editor stores the Ceros experience URL. The URL format must match Ceros's canonical URL structure — validate before saving.
- The EntryEditor location replaces the full entry editor — it is not a field-level component.

## Never / Always

- **Never** render oEmbed HTML via `dangerouslySetInnerHTML` — use a sandboxed iframe.
- **Always** validate the Ceros URL format before writing to the entry.
