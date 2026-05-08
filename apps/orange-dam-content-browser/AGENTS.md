# Agent Guide — orange-dam-content-browser

## What This App Does
Integrates Orange DAM (Digital Asset Management) with Contentful. Lets editors select assets from Orange DAM for use in Contentful fields. The active source for this app is in this repo (not `contentful/apps`, which has an empty stub). Published as `orange-dam-content-browser-contentful-plugin`.

## Archetype
Standard Vite app. Not using `dam-app-base` — fully custom implementation with a Field and Dialog location.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | Custom field editor displaying selected Orange DAM assets |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | Orange DAM asset browser/picker |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |

## Source Layout

```
src/
├── App.tsx
├── locations/             # Field, Dialog
├── components/
├── logos/                 # Brand assets
├── types.tsx              # TypeScript types
├── utils/
├── styles.css
├── web-component.d.ts     # Orange DAM uses a web component for the picker
└── react-web-component.d.ts
```

## Sharp Edges & Invariants

- **Web component integration**: Orange DAM's asset browser is implemented as a Web Component (`web-component.d.ts`, `react-web-component.d.ts`). This is unusual — most Marketplace apps use JavaScript SDK pickers. When modifying the Dialog, understand how React interacts with the web component (event handling, property passing).
- **Cypress tests**: `App.cy.tsx` and `types.cy.tsx` indicate this app uses Cypress (not just Vitest). Check `package.json` for the test command before assuming `npm test` runs Vitest.
- Orange DAM credentials/endpoint are in installation parameters.

## Never / Always

- **Never** assume standard Vitest test setup — this app may use Cypress for component testing.
- **Always** use `useAutoResizer()` in the Field and Dialog locations.
