# Agent Guide — transifex

## What This App Does
Integrates Transifex (translation management platform) with Contentful. Lets editors send Contentful entries to Transifex for professional translation and receive translated content back. Published as `transifex-contentful-app`.

## Archetype
Standard Vite app. Uses **JSX, not TSX** — TypeScript strictness does not apply.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Transifex API token and project settings |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Entry translation status and send-to-Transifex controls |

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
├── App.jsx              # JSX, not TSX
├── locations/           # ConfigScreen (may be .jsx), Sidebar (.jsx)
├── api.js               # Transifex API client
├── assets/
├── components/
└── index.jsx
```

## Sharp Edges & Invariants

- **JSX/JS throughout** — do not add TypeScript to this app without a full migration plan. All component and utility files are `.jsx` or `.js`.
- **`src/api.js`**: all Transifex API calls go through this module. Do not make Transifex API calls directly from components.
- **Transifex API token** is in installation parameters — never log it.
- **Translation round-trip**: similar to the `smartling` app, content is serialized, sent to Transifex, and the completed translation is returned. The serialization/deserialization logic is critical — bugs corrupt translated content.
- **CSS in `index.css`**: the app uses a plain CSS file. Follow the existing styling approach rather than introducing CSS-in-JS.

## Never / Always

- **Never** add TypeScript to this app without a migration plan.
- **Never** call the Transifex API outside `src/api.js`.
- **Always** use `useAutoResizer()` in the Sidebar location.
