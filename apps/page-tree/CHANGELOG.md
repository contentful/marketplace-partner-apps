# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added

- **`detectOrphans` app config flag**: a new boolean installation parameter
  (default `true`) that controls orphaned-page detection. When set to `false`,
  `computeOrphanPaths` and `findOrphanItems` are skipped entirely (no
  computation, no UI), duplicate detection is unaffected, and
  `missingPaths` entries are excluded from the structural-issue count.
  Admins toggle the setting via a new **"Detect orphaned pages"** switch on the
  Configuration Screen. Existing installations that lack the parameter continue
  to behave as before (treated as `true`).

---

## [0.2.1] - 2026-07-24

### Fixed

- **Error state exposed**: `useSitemapData` now surfaces `error: string | null`
  instead of silently swallowing CMA failures; the Full Sitemap page renders a
  negative `<Note>` when the data fetch fails and suppresses the misleading
  "No results" message (mirrors existing sidebar behaviour)
- **Duplicate `computeState` removed**: the inline copy in `sitemapData.ts`
  was mathematically equivalent to `computeStateFromSys()` in `state.ts` and
  has been deleted; all call sites now use the shared function
- **`emotion` → `@emotion/css`**: replaced the deprecated `emotion` v10
  package with the current `@emotion/css` v11 (drop-in for `css({…})` usage);
  `emotion` removed from `package.json`
- **`contentful-management` removed**: the package was listed as a direct
  dependency but never imported from `src/`; removed
- **Dependency audit cleaned**: `overrides.yaml` pin removed; `npm audit fix`
  run — production audit is clean; remaining advisories are dev-only
- **CMA cache**: `loadSitemapItems` now caches results in memory for 60 s
  keyed by space / environment / sources / locale; `clearSitemapCache()`
  exported for tests
- **429 retry**: `fetchAllEntriesForContentType` retries on HTTP 429 with
  exponential back-off (500 ms → 1 500 ms, 2 retries max)
- **Concurrency capped**: sources are now fetched sequentially instead of via
  unbounded `Promise.all`
- **`SITEMAP_PAGE_PATH` constant**: the literal `"/sitemap"` extracted to
  `src/config/defaults.ts` and used in `PageTree.tsx`; documented in
  `docs/installation.md`
- **`DuplicatesNote` DOM warnings fixed**: `borderColor / borderWidth /
borderStyle / borderRadius` were invalid `<Box>` props in this f36 version
  and leaked to the DOM; replaced with an inline `style` object using Forma 36
  tokens
- **Keyboard accessibility**: sidebar caret (`PageTree.tsx`) now has
  `role="button"`, `tabIndex=0`, and responds to both Enter and Space;
  `TreeRow.tsx` caret and pill also respond to Space (Enter was already wired)

### Added

- Tests for new `error` return from `useSitemapData` (hook unit test +
  `Page.tsx` integration test)
- Tests for cache hit/miss, 429 retry, exhaustion propagation, non-429
  pass-through, and sequential source ordering

---

## [0.2.0] - 2026-07-22

### Added

- **Orphaned-page detection**: entries whose configured path field is empty
  are surfaced in a warning panel (previously silently excluded), and pages
  whose direct parent URL has no entry behind it ("ghost parents") get an
  **Orphan** badge in the tree plus a listing in the same panel — in both the
  entry sidebar and the Full Sitemap page (`src/core/orphans.ts`,
  `src/components/OrphansNote.tsx`)

### Changed

- `loadSitemapItems` now returns `missingPaths` alongside `items` and `duplicates`
- `DuplicatesNote` moved to `src/components/` and shared by the sidebar and
  Page locations (navigation injected via `onOpenEntry` callback)
- Sidebar shows a compact structural-issues summary linking to the Full
  Sitemap instead of full warning panels (details live in the Page location)
- All custom styling now uses Forma 36 design tokens (colors, spacing, radii,
  Geist type stacks) for a native Contentful look
- Full Sitemap subtitle shows the environment alias (e.g. "master") when one
  is active
- Production error boundary: crashes render a readable error instead of a
  blank iframe; unknown locations show a hint

### Removed

- Unused scaffolding locations (Field, Dialog, EntryEditor, Home) and their
  registrations in `App.tsx`

---

## [0.1.1] - 2026-02-08

### Added

- CI pipeline with deterministic Node and dependency installation
- Automated release workflow for Contentful App Framework bundles
- Initial production documentation:
  - README
  - Installation guide
  - Architecture overview

### Changed

- Stabilized dependency resolution for CI and release builds
- Hardened test execution for non-interactive environments

### Fixed

- Lockfile inconsistencies preventing `npm ci` in CI environments

---

## [0.1.0] - Initial Release

### Added

- Initial PageTree Contentful app
- Core page tree, path, and state logic
- Contentful App Framework integration
- Vite-based build system
