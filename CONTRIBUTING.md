# Contributing to contentful/marketplace-partner-apps

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.0.0, **< 22.0.0** (CI runs on **20**) |
| npm | ≥ 9.0.0, **< 11.0.0** |

Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to manage Node versions.

---

## Initial Setup

```bash
# Clone the repo
git clone https://github.com/contentful/marketplace-partner-apps.git
cd marketplace-partner-apps

# Install root dependencies
npm ci

# Install dependencies for a specific app
cd apps/<app-name>
npm run install-ci
# or just: npm ci
```

> **Note**: This repo uses `install-ci` (not `lerna bootstrap`) as the install convention. Each app defines an `install-ci` script in its `package.json` that maps to `npm ci`.

To install all apps (full deploy context):
```bash
npm run install-apps:deploy
```

---

## Running an App Locally

```bash
cd apps/<app-name>

# Start the Vite dev server
npm start
# or
npm run dev
```

Opens the app at `http://localhost:3000`. Requires the app to be configured in a Contentful organization.

**Exception — `translationstudio`** (Next.js):
```bash
cd apps/translationstudio
npm run dev    # Next.js dev server on port 3000
```

---

## Running Tests

```bash
# All changed apps (from repo root)
npm run test-apps

# Single app
cd apps/<app-name>
npm test          # watch mode
npm run test:ci   # single run (used in CI)
```

Tests use **Vitest** + **React Testing Library** for standard Vite apps. `translationstudio` uses **Jest**.

---

## Building

```bash
# All changed apps (from repo root)
npm run build-apps

# Single app
cd apps/<app-name>
npm run build
```

---

## Linting & Formatting

```bash
# Prettier check (from root)
npx prettier --check '**/*.{ts,tsx,js,jsx,json}'

# Prettier fix
npx prettier --write '**/*.{ts,tsx,js,jsx,json}'
```

Prettier runs automatically on staged files via `lint-staged` (triggered by the `husky` pre-commit hook).

---

## Code Conventions

- **TypeScript + React + Vite + Vitest + Forma 36** in all new apps and standard app changes.
- **`useSDK()`** from `@contentful/react-apps-toolkit` for all SDK access.
- **`useAutoResizer()`** in Field, Sidebar, EntryEditor, and Dialog locations.
- **`sdk.app.setReady()`** after async initialization in ConfigScreen.
- **Forma 36 components** (`@contentful/f36-*`) for all UI — no ad-hoc CSS or plain HTML layout.
- **Conventional Commits** for all commit messages (`feat:`, `fix:`, `chore:`, `docs:`, etc.) — these drive `release-please` versioning.
- **No `any` in TypeScript** — use explicit types.

**Exceptions to F36 rule:**
- `sfmc-studio` uses Ant Design — do not change its component library.
- `transifex`, `voucherify`, `shopify` use JSX — TypeScript strictness does not apply.

---

## Branching & PR Strategy

- **Base branch**: `main` (not `master`)
- **Feature branches**: `<type>/<description>` (e.g. `feat/bynder-video-support`)
- PRs require review and CI to pass before merge
- Use **Conventional Commits** in PR titles — `release-please` reads these to determine version bumps
- PR title format is enforced by `.github/workflows/pr-title-check.yml`

---

## Release Process

**Do not manually bump versions.** Versioning is fully automated via `release-please`:

1. Merge a feat/fix commit to `main`
2. `release-please` detects the conventional commit and creates a release PR (title: `chore: release <app> <version>`)
3. Merging the release PR: updates `CHANGELOG.md`, bumps `package.json` version, creates a git tag
4. The `release-and-deploy.yml` workflow deploys the tagged app to production

Each app is versioned independently. `release-please-config.json` in the root defines which apps are tracked.

---

## Deploying

Deployments are managed by GitHub Actions. Manual deploys (requires org credentials):

```bash
cd apps/<app-name>

# Deploy to production
npm run deploy

# Deploy to staging
npm run deploy:staging
```

Requires `CONTENTFUL_CMA_TOKEN` + `DEFINITIONS_ORG_ID` (production) or `TEST_CMA_TOKEN` + `TEST_ORG_ID` (staging).

---

## Adding a New Partner App

New apps go through a formal review process:

1. Follow the new app submission guidelines (see `.github/workflows/new-app-review.yml` and `.github/workflows/new-app-review/`)
2. The app must pass automated policy checks (manifest, bundle, security)
3. Add an entry to `release-please-config.json` for versioning
4. Add an `AGENTS.md` to the app root
5. Ensure the app defines `install-ci`, `build`, `test:ci`, `deploy`, and `deploy:staging` scripts in `package.json`

---

## Troubleshooting

**`npm ci` fails in an app**
Run `npm install` directly in that app's directory to see the raw npm error.

**App doesn't load in Contentful**
Ensure `npm start` is running and the App Definition's frontend URL points to `http://localhost:3000`.

**Type errors after pulling**
Re-run `npm run install-ci` in the affected app — a dependency may have been added or updated.

**Prettier pre-commit hook fails**
Run `npx prettier --write '**/*.{ts,tsx,js,jsx,json}'` and re-stage.

**release-please didn't create a release PR**
Verify that the commit message follows Conventional Commits format exactly — `feat:` or `fix:` triggers a release; `chore:` does not.
