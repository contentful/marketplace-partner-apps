# Agent Guide — page-tree

## What This App Does

PageTree is a site-structure governance and navigation tool. It reads the
configured content types, builds their pages into a URL hierarchy, and renders
that tree in the entry sidebar (rooted at the current entry) and as a full-page
sitemap with search. It continuously flags structural problems — **duplicate
paths**, **orphaned pages** (empty path field, or a parent URL with no entry
behind it) — and lets editors jump straight to any entry.

## Archetype

Standard Vite app (React + TypeScript + Vitest + Forma 36).

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure sources (content type + path/title field + route prefix), base URL, and the `detectOrphans` toggle |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar.tsx` → `src/components/PageTree.tsx` | Subtree rooted at the current entry + compact structural-issue summary |
| `LOCATION_PAGE` | `src/locations/Page.tsx` (+ `src/locations/page/`) | Full sitemap: search, expand/collapse, refresh, duplicate/orphan panels |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK types/locations |
| `@contentful/react-apps-toolkit` | `useSDK()`, `SDKProvider`; provides `sdk.cma` |
| `@contentful/f36-components` / `-icons` / `-tokens` | Forma 36 UI + design tokens |
| `@emotion/css` | `css()` for the few custom tree-row layout styles |

There is **no** direct `contentful-management` or CDA client — all reads go
through `sdk.cma` (CMA, scoped to the user's session and permissions).

## Source Layout

```
src/
├── App.tsx                 # location router
├── index.tsx               # SDKProvider + ErrorBoundary bootstrap
├── config/                 # DEFAULT_CONFIG, SITEMAP_PAGE_PATH, getConfig, normalize
├── core/                   # data model (no UI)
│   ├── sitemapData.ts      # CMA fetch + cache + 429 retry + dedupe  ← the engine
│   ├── tree.ts             # buildTreeFromItems / filterTreeByQuery
│   ├── path.ts             # normalizePath / buildPath / route-prefix rules
│   ├── orphans.ts          # ghost-parent + missing-path detection
│   ├── state.ts            # computeStateFromSys (draft/published/changed)
│   └── useAppConfig.ts     # installation-params → typed AppConfig
├── components/             # PageTree (sidebar), DuplicatesNote, OrphansNote, ErrorBoundary
└── locations/
    ├── ConfigScreen.tsx, Sidebar.tsx, Page.tsx
    └── page/               # hook.ts (useSitemapData etc.), components/, styles.ts
```

## Sharp Edges & Invariants

- **`core/sitemapData.ts` is the only entry point for loading.** It fetches all
  entries per configured content type (paginated, `limit=1000`), maps them to
  `TreeItem`s, dedupes by path, and returns `{ items, duplicates, missingPaths }`.
  Do not fetch entries elsewhere.
- **In-memory cache, 60s TTL**, keyed by `space + environment + sources + locale`.
  It is enabled **only when both `spaceId` and `environmentId` are passed** — this
  prevents two environments in one space from colliding on a blank env key. Unit
  tests omit the ids so caching stays off. Bust it with `clearSitemapCache()` or,
  from the UI, `useSitemapData().refresh()` (wired to the **Refresh** button in the
  Full Sitemap toolbar).
- **429 handling**: `fetchWithRetry` retries twice (500ms/1500ms) on rate-limit
  errors only. Sources are fetched **sequentially** to cap concurrency.
- **Path rules** (`core/path.ts`): a slug starting with `/` is treated as an
  absolute path and **ignores `routePrefix`**; paths are normalized (leading `/`,
  no trailing `/`) and **case-sensitive** (`/About` ≠ `/about`).
- **Publish state lives in one place** — `core/state.ts` `computeStateFromSys`
  (`draft` = no `publishedVersion`; `changed` = `version > publishedVersion + 1`).
  Do not reintroduce a second copy.
- **Orphan detection is gated by `config.detectOrphans`** (default `true`). Two
  kinds: entries with an empty path field (`missingPaths`) and pages whose parent
  path has no backing entry (ghost parents).
- **Default-locale only**: data is read with `sdk.locales.default`. `config.locale`
  exists but is not used for fetching; `getLocalizedString` falls back to the first
  available locale string. Do not assume multi-locale correctness.
- **`SITEMAP_PAGE_PATH`** (`src/config/defaults.ts`, `"/sitemap"`) must match the
  App Definition's Page-location path — the sidebar's "Open Full Sitemap" navigates
  to it. Changing one without the other breaks that button.
- **Duplicate winner is fetch-order**, not deterministic across content types
  (`pickWinnerByCreatedAt` returns `entries[0]`).
- **Styling**: Forma 36 components + tokens; `@emotion/css` only for the tree-row
  layout that F36 primitives don't cover. No global CSS files.

## Never / Always

- **Never** fetch entries outside `loadSitemapItems` — you'll lose caching, retry, and dedupe.
- **Never** reintroduce `emotion@10` or a direct `contentful-management` dependency (both were removed).
- **Never** enable the cache on `spaceId` alone — require `environmentId` too.
- **Never** hand-bump the version — `release-please` owns it.
- **Always** keep publish-state logic in `core/state.ts` (one `computeStateFromSys`).
- **Always** run on Node 20 (the monorepo's root `.nvmrc` is `lts/iron`); it requires Node ≥ 18, < 22.
