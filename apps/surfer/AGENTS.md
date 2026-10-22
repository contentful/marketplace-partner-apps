# Agent Guide — surfer

## What This App Does
Helps you write and optimize content for SEO and GEO, right where you already work. Provides real-time SEO and GEO content scoring by embedding the Surfer Content Editor panel (an iframe served by Surfer) in the Entry Sidebar and feeding it the entry's RichText content as HTML. All scoring happens inside the panel. Published as `surfer-contentful-app`.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Select content types and RichText fields Surfer reads |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Mounts the Surfer panel and sends it the selected fields' HTML |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()` |
| `@contentful/rich-text-html-renderer` | RichText → HTML for the panel |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, Sidebar
├── assets/
├── components/
├── hooks/
├── types.ts
└── Surfer.ts          # Wrapper around the Surfer SDK (window.surferGuidelines)
```

## Sharp Edges & Invariants

- The Surfer SDK is loaded by a `<script>` in `index.html`. `window.SURFER_EXT_CONF` (panel origin, RPC debug) must be set before it. Values come from `VITE_*` env vars; production values live in `.env.production`, local overrides go in `.env.local`.
- No Surfer API calls and no credentials — the user signs in to Surfer inside the panel.
- The share token `${spaceId}_${entryId}` links an entry to its Surfer draft. Changing it unlinks every existing entry.
- The panel iframe needs `allow="clipboard-write"` (set in `Surfer.initialize`) for copy to work.

## Never / Always

- **Never** change the share token format.
- **Always** run `Surfer.spec.ts` after changes to `Surfer.ts`.
