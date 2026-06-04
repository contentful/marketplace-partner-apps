# Agent Guide — contentful/marketplace-partner-apps

## Table of Contents

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Repo overview |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Monorepo structure, app archetypes, CI/CD pipeline, key differences from `contentful/apps` |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Dev setup, test/build commands, branching, release process |
| `apps/<name>/AGENTS.md` | Per-app sharp edges, locations, and invariants |
| `packages/contentful-app-components/` | Shared `@contentful/app-components` library |

---

## Context & Scope

- This repo contains **38 partner-contributed Contentful Marketplace apps** plus a shared component library.
- Apps are built with **React + TypeScript + Vite + Vitest + Forma 36** (standard), with exceptions noted below.
- **Partner ownership**: each app is maintained by an external partner. Contentful's role is governance. Keep changes minimal and backwards-compatible unless coordinated with the partner.
- **Read the target app's `AGENTS.md` first** — it documents locations, key dependencies, and sharp edges for that specific app.
- Base branch is **`main`** (not `master`).

---

## Critical Differences from `contentful/apps`

These will cause mistakes if you carry assumptions from that repo:

| Topic | `contentful/apps` | This repo |
|-------|-------------------|-----------|
| CI | CircleCI | **GitHub Actions** |
| Base branch | `master` | **`main`** |
| Releases | `lerna version` | **`release-please`** — never manually bump versions |
| Install command | `lerna bootstrap` | **`npm run install-ci`** per app |
| Node | ≥ 16 | **≥ 18, < 22** |
| npm | ≥ 8 | **≥ 9, < 11** |

---

## App Archetypes (quick reference)

See [ARCHITECTURE.md](ARCHITECTURE.md) for full details.

| Archetype | Marker | Examples |
|-----------|--------|---------|
| Standard Vite | `src/locations/` dir | Most apps |
| DAM base | depends on `@contentful/dam-app-base` | `frontify`, `bynder` (partial) |
| Ecommerce base | depends on `@contentful/ecommerce-app-base` | `shopify` |
| Next.js | `next.config.js` + `pages/` | `translationstudio` |

---

## Golden Rules

1. **Use React + TypeScript + Vite + Vitest + Forma 36** in standard apps.
2. **`useSDK()`** from `@contentful/react-apps-toolkit` — never access the SDK directly.
3. **`useAutoResizer()`** in Field, Sidebar, EntryEditor, and Dialog locations.
4. **`sdk.app.setReady()`** after async initialization in ConfigScreen.
5. **Inspect `package.json` first** — reuse installed libraries; justify new dependencies.
6. **No deprecated APIs** — check Forma 36, App SDK, contentful-management changelogs.
7. **No `any` in TypeScript** — use explicit, narrow types.
8. **Conventional Commits** for every commit — `release-please` reads these for versioning.
9. **Small, incremental changes** — do not add unrequested changes.
10. **Check `@contentful/app-components`** in `packages/` before building custom shared components.

---

## Exceptions to Standard Rules

- **`sfmc-studio`**: uses Ant Design (`antd`) + Redux — not Forma 36. Do not apply F36 rules here.
- **`translationstudio`**: Next.js app — Vite patterns do not apply. Check `next.config.js`.
- **`transifex`**, **`voucherify`**, **`shopify`**: JSX (not TSX) — TypeScript strictness does not apply.
- **`bynder`**: hybrid — uses `dam-app-base` as a base but also has a custom `Sidebar` location.

---

## Never / Always

**Never:**
- Manually bump package versions — `release-please` owns all versioning.
- Run `lerna version` or `lerna publish` manually.
- Run `lerna run build` without `--since main` unless building for full deployment.
- Commit API keys, CMA tokens, or org/space IDs.
- Add cross-app `import` dependencies — each app must be self-contained.
- Skip `sdk.app.setReady()` in a ConfigScreen — the app will appear stuck loading.
- Apply `contentful/apps` CI patterns (CircleCI, `lerna bootstrap`) to this repo.

**Always:**
- Read the target app's `AGENTS.md` before proposing changes.
- Run `npm run build` in the app directory to verify your change compiles.
- Use Forma 36 `Note` for empty states, `Notification` for user-facing errors (standard apps).
- Wrap all CMA calls in try/catch and surface errors via notifications.
- Check `apps/<name>/package.json` for specific library versions before referencing SDK APIs.
- Treat `main` (not `master`) as the base branch for all `--since` flags.

---

## Official Documentation

- App Framework: https://www.contentful.com/developers/docs/extensibility/app-framework/
- App SDK reference: https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/
- App Actions: https://www.contentful.com/developers/docs/extensibility/app-framework/app-actions/
- Forma 36 components: https://f36.contentful.com/
- CMA reference: https://www.contentful.com/developers/docs/references/content-management-api/

---

## Required Response Structure

After code changes, always include:

- **Goal** — what is changing and why
- **Approach** — high-level solution + links to official docs used
- **Scope** — files affected and dependency usage
- **Git commit proposal** — Conventional Commit format
- **Next steps** — tests, docs, or follow-ups (if applicable)

Before responding, verify:
- [ ] `npm run build` succeeds in the app directory
- [ ] No linter errors on modified files
- [ ] TypeScript types are correct (no `any`, proper imports)
- [ ] Forma 36 components used correctly (standard apps only)
- [ ] No deprecated Contentful SDK methods
- [ ] Changes are consistent with existing patterns in the app
