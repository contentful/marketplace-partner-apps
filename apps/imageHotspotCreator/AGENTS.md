# Agent Guide — imageHotspotCreator

## What This App Does
Provides an entry editor for creating and managing image hotspots — interactive click targets overlaid on an image. Editors place hotspot markers on an image and associate each marker with linked content (entries or external URLs). Published as `image-hotspot-creator`.

## Archetype
Standard Vite app. Entry editor location only.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_ENTRY_EDITOR` | `src/locations/EntryEditor/` | Full entry editor — hotspot placement UI |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()` |
| `contentful` | CDA client — for reading linked entries/assets |
| `contentful-management` | CMA — for reading asset data |

## Source Layout

```
src/
├── App.tsx
├── locations/         # EntryEditor
├── Assets/            # Asset loading utilities
└── components/        # Hotspot canvas, marker, tooltip components
```

## Sharp Edges & Invariants

- **Hotspot data schema**: hotspots are stored as a JSON array in a dedicated field (e.g. `[{ x: 0.3, y: 0.5, linkedEntry: 'entry-id', ... }]`). Coordinates are normalized 0–1. Changing this schema requires migrating existing data.
- **Canvas rendering**: hotspot placement is rendered as an overlay on the image. Coordinates are calculated relative to the rendered image size — the coordinate calculation must account for image aspect ratio and container size changes (resize observer).
- Both CDA (`contentful`) and CMA (`contentful-management`) are used — CDA for reading linked entry previews, CMA for reading asset metadata.
- **`Assets/` directory**: image loading and URL resolution logic — check here before modifying how the background image is fetched.

## Never / Always

- **Never** store hotspot coordinates as pixel values — use normalized 0–1 coordinates.
- **Never** use the CDA token for write operations.
