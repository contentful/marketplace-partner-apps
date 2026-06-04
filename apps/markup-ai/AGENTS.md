# Agent Guide — markup-ai

## What This App Does
AI-powered content enhancement tool that analyzes Contentful rich-text and text content and suggests improvements — grammar fixes, tone adjustments, SEO optimization, etc. Runs from the Entry Sidebar with a Dialog for reviewing suggestions. Published as `markup-ai-contentful-app`.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Markup AI API key and preferences |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Trigger analysis; show summary of suggestions |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | Review and apply AI suggestions to fields |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |
| `contentful-management` | CMA for reading/writing field values |

## Source Layout

```
src/
├── App.tsx
├── App.spec.tsx         # App-level tests
├── locations/           # ConfigScreen, Sidebar, Dialog
├── api-client/          # Markup AI API client
├── components/
├── constants/
├── contexts/            # React context for suggestion state
├── hooks/
├── i18n/                # Internationalization strings
├── services/            # Business logic layer
└── utils/
```

## Sharp Edges & Invariants

- **Markup AI API key** is in installation parameters — never log it.
- **`i18n/`**: this app has an internationalization layer — all user-facing strings should go through it. Do not hardcode English strings in components.
- **`api-client/`**: all Markup AI API calls go through this module. Do not call the API directly from components.
- **`contexts/`**: suggestion state is shared across locations via React context — if adding new AI result types, thread them through context, not local component state.
- `App.spec.tsx` and `index.spec.tsx` suggest this app has good test coverage — run tests after any change.

## Never / Always

- **Never** hardcode user-facing strings — use `i18n/`.
- **Never** log the Markup AI API key.
- **Always** use `useAutoResizer()` in the Sidebar location.
