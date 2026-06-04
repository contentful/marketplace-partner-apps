# Agent Guide — convox

## What This App Does
Integrates Convox (container deployment platform) with Contentful. Shows deploy status and lets editors trigger Convox deployments from the Entry Sidebar — similar in concept to the netlify/vercel apps in `contentful/apps`.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Convox API key, rack, and app name |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Deploy status and trigger controls |

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
├── locations/           # ConfigScreen, Sidebar
├── client/              # Convox API client
├── components/
├── constants/
├── customTypes/         # TypeScript types for Convox API responses
├── helpers/
└── hooks/
```

## Sharp Edges & Invariants

- **Convox API key** is in installation parameters — never log it.
- **`client/`**: all Convox API calls go through the client module. Do not make Convox API calls directly from components.
- Convox API calls are made from the browser (no Lambda/App Actions) — CORS must be permitted by Convox.
- Deploy status is polled from the Sidebar — respect the existing polling interval.

## Never / Always

- **Never** log the Convox API key.
- **Always** use `useAutoResizer()` in the Sidebar.
