# Agent Guide — translationstudio

## What This App Does
Integrates Translation Studio (professional translation service) with Contentful. Manages the full translation workflow — submitting entries for translation, tracking status, and importing completed translations back into Contentful. Published as `translationstudio`.

## Archetype
**Next.js app** — the only app in this repo using Next.js instead of Vite. Served via `serve` for the Contentful iframe embed.

> All Vite patterns (vite.config.ts, vitest, HMR) do not apply here. Use Next.js conventions.

## Structure

```
apps/translationstudio/
├── pages/                 # Next.js pages router (not App Router)
├── components/            # React components
├── interfaces/            # TypeScript interfaces
├── utils/                 # Utility functions
├── public/                # Static assets
├── readme-data/           # README assets
├── next.config.js         # Next.js configuration
├── next-env.d.ts
├── jest.config.js         # Uses Jest (not Vitest)
├── jest.setup.js
└── tsconfig.json
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |
| `next` | Next.js framework |
| `serve` | Static server for production build (Contentful iframe hosting) |

## Additional Docs

| File | Purpose |
|------|---------|
| `HOWTO.md` | Developer setup and workflow guide |
| `INSTALLATION.md` | App installation instructions |
| `PRIVACY.md` | Privacy policy |

## Sharp Edges & Invariants

- **Next.js, not Vite** — use `next.config.js` (not `vite.config.ts`) for build configuration. Dev server is `npm run dev` (Next.js default, port 3000).
- **Jest, not Vitest** — tests use `jest.config.js` and `jest.setup.js`. Run tests with `npm test` (which invokes Jest). Do not add Vitest.
- **`pages/` router** — this app uses the Next.js Pages Router, not the App Router. New routes go in `pages/`, not `app/`.
- **`serve` for production**: the production build is served via the `serve` package as a static site — not a Next.js server. The app must be fully static (no server-side rendering or API routes that require a Node.js server at runtime).
- **Translation workflow is complex** (similar to `smartling`) — serialization/deserialization of Contentful content for the Translation Studio format is critical; bugs corrupt translated entries.
- Read `HOWTO.md` before making any changes.

## Never / Always

- **Never** use Next.js API routes or SSR features — the app must build as a static export.
- **Never** add Vitest — this app uses Jest.
- **Always** read `HOWTO.md` before making structural changes.
