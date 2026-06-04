# Agent Guide — launchdarkly

## What This App Does
Integrates LaunchDarkly (feature flagging platform) with Contentful. Lets editors link Contentful entries to LaunchDarkly feature flags, view flag status, and manage flag-gated content from within Contentful. Published as `launchdarkly-contentful-app`.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure LaunchDarkly SDK key and project |
| `LOCATION_ENTRY_EDITOR` | `src/locations/EntryEditor.tsx` | Entry-level feature flag selector |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Sidebar showing linked flag status and targeting rules |
| `LOCATION_PAGE` | `src/locations/Page/` | Full-page flag management interface |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |
| `contentful-management` | CMA |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, EntryEditor, Sidebar, Page
├── components/
├── hooks/
├── types/
└── utils/
```

## Sharp Edges & Invariants

- **LaunchDarkly SDK key** (server-side) and **client-side ID** are different — installation parameters should store the appropriate key type for each use case. Never use the server-side SDK key in a browser-accessible app.
- **LaunchDarkly REST API** is called from the frontend — this requires the LaunchDarkly Access Token, not the SDK key. Verify which credential is stored in installation parameters.
- Flag linkage is likely stored as a JSON or Symbol field value.

## Never / Always

- **Never** use the LaunchDarkly server-side SDK key in the browser — use the client-side ID or REST API access token.
- **Always** use `useAutoResizer()` in the Sidebar location.
