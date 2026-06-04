# Agent Guide — surfer

## What This App Does
Integrates Surfer SEO with Contentful. Provides real-time SEO content scoring and keyword optimization suggestions in the Entry Sidebar and a Dialog for detailed SEO analysis. Published as `surfer-contentful-app`.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Surfer API key and account settings |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Real-time SEO score and keyword suggestions |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | Detailed Surfer SEO analysis panel |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/f36-icons` | Icons |
| `@contentful/f36-multiselect` | Multi-select for keyword selection |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, Sidebar, Dialog
├── assets/
├── components/
├── hooks/
├── types.ts
└── Surfer.ts          # Surfer API client
```

## Sharp Edges & Invariants

- **`Surfer.ts`** is the API client (not in a `services/` subdirectory as typical) — all Surfer API calls go through this module.
- **`Surfer.spec.ts`** tests the API client — run these after any changes to `Surfer.ts`.
- **Surfer API key** is in installation parameters — never log it.
- SEO scoring is computed by Surfer's API, not client-side — the Sidebar makes API calls on load and potentially on field value changes. Debounce triggers to avoid hammering the API.

## Never / Always

- **Never** log the Surfer API key.
- **Always** use `useAutoResizer()` in the Sidebar location.
- **Always** debounce Surfer API calls triggered by field value changes.
