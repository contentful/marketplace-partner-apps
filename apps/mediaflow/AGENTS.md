# Agent Guide — Mediaflow

## What This App Does
Integrates the Mediaflow digital asset management system with Contentful. Editors pick files from Mediaflow in a JSON object field through the Mediaflow file selector. The app copies the file to the Mediaflow CDN, stores the file's metadata (alt text, description, keywords, custom fields, dimensions, …) in the field, shows it in an asset card, keeps it in sync with Mediaflow, and reports where the file is used back to Mediaflow.

## Archetype
Standard Vite app with a separate authentication backend. The frontend authenticates against Mediaflow through a small Node/Express service hosted by Mediaflow, which verifies Contentful's signed requests and exchanges the installation's OAuth credentials for a Mediaflow access token. The backend is not part of this repository.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Mediaflow OAuth credentials (client id, client secret, refresh token), the "Show links to files in Mediaflow" setting, and the content type assignments (JSON object fields and sidebar; logic in `src/utils/ContentTypeAssignment.ts`) |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field.tsx` | JSON object field: select, replace and remove a Mediaflow file, upload it to the CDN, check and sync its metadata |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` | Button that syncs the metadata of every Mediaflow field in the entry at once |
| `LOCATION_DIALOG` | `src/locations/Dialog.tsx` | Hosts the Mediaflow file selector, loaded from `https://mfstatic.com/js/fileselector.min.js` |

## Data Flow
- The field value is the file selector's result plus `isMediaflowAsset`, `resourceId` (the CDN resource) and `isCropped`; see `MediaflowFileData` in `src/types.ts`.
- `src/utils/TokenManager.ts` gets the Mediaflow access token via the backend and keeps it until 60 seconds before it expires (`VITE_BACKEND_URL`, set in `.env.production`).
- `src/utils/MediaflowApi.ts` sends every Mediaflow API request (`mediaflowRequest` / `mediaflowJson`): checks the status, refreshes the token once after a 401, retries a 429 as `Retry-After` says, and throws `MediaflowApiError` with a `kind` for messages.
- `src/utils/Util.ts` compares stored metadata with Mediaflow and syncs it in one request for many fields (`batchUpdateMetadata`).
- `src/utils/MetadataView.ts` turns the field value into what the asset card shows. These are pure functions; keep display logic there and covered by tests.
- `src/utils/UsageReport.ts` builds the usage report sent to Mediaflow (space, content type, entry title, link to the entry). `src/utils/UsageReporter.ts` holds a report back until an untitled entry gets a title, and `Field.tsx` sends a waiting report on `pagehide` with `keepalive`.
- `src/components/JsonField.tsx` builds the card's view model; `MediaflowAssetCard.tsx` and `MetadataDetails.tsx` only render it. Styles live in `*.styles.ts` next to each component.

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |
| `@contentful/f36-components`, `@contentful/f36-icons`, `@contentful/f36-tokens` | Forma 36 UI |
| `@emotion/css` | `css()` for the component styles |

External resources: the Mediaflow file selector script and stylesheet (`mfstatic.com`), the Mediaflow API (`api.mediaflow.com`) and the authentication backend.

## Commands

| Command | What it does |
|---------|--------------|
| `npm run install-ci` | Install dependencies from the lock file |
| `npm start` | Dev server on http://localhost:3000 (set `VITE_BACKEND_URL` in `.env.development.local`, ending with `/`) |
| `npm run build` | Production build into `build/` |
| `npm test` / `npm run test:watch` | Vitest (single run with coverage / watch) |
| `npm run lint` | Type check and ESLint |

## Conventions
- TypeScript strict mode, no `any`; Forma 36 for all UI.
- Tests in `test/`: Vitest, with React Testing Library for components (`// @vitest-environment jsdom` per file).
- Node 24 locally (see `.nvmrc`); `engines` allows Node >=20.19.0 and npm >=10.8.0, since Contentful's marketplace CI runs Node 20.
