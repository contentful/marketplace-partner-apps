# PageTree

**PageTree** is a site-structure governance and navigation tool for
Contentful. It gives teams a clear, editor-friendly view of page hierarchy —
and continuously flags structural problems like orphaned pages and duplicate
URLs before they reach production.

PageTree is designed to feel **native to Contentful** — lightweight, fast, and
aligned with Forma 36 patterns.

---

## Why PageTree?

As Contentful spaces grow, understanding page relationships becomes harder:

- Editors lose context of where a page lives
- Duplicate or conflicting paths become difficult to spot
- Navigating large, nested structures is slow and error-prone

PageTree addresses these challenges by offering:

- A visual representation of page hierarchy, in the entry sidebar and as a
  full-space sitemap with search
- Clear indication of the current page and publication state
  (published / draft / changed)
- Direct navigation — click any node to open its entry
- Expand/collapse navigation for large trees
- **Duplicate URL warnings** when multiple entries resolve to the same path
- **Orphaned-page detection** — entries with an empty path field, and pages
  whose parent URL has no entry behind it (can be disabled in the app
  configuration if your implementation intentionally uses orphan records)

---

## Using PageTree

Once installed, configure the app and start navigating your space.

**1. Configure** — open the app's configuration screen and set:

- **Base URL** — your site root (e.g. `https://www.example.com`), used for
  preview links.
- **Sources** — for each content type that represents a page, add a source and
  choose:
  - the **content type**;
  - the **slug / path field** — a short-text field. A value starting with `/`
    is treated as an absolute path; otherwise it is appended to the route
    prefix.
  - an optional **route prefix** (e.g. `/news`);
  - an optional **title field** (falls back to the last path segment).
- **Detect orphaned pages** — leave on to surface structural issues; turn off
  only if your model intentionally uses entries with empty paths.

**2. Entry sidebar** — on any entry of a configured type, the sidebar shows the
page tree rooted at that entry. Click a node to open its entry; a compact banner
summarizes structural issues and links to the full sitemap.

**3. Full sitemap** (page location) — open the app from the space's Apps menu
for a view of the whole space:

- **Search** by path or title.
- **Expand all / Collapse all**, and **Refresh** to re-read the space.
- Each node shows a publish-state badge — **Published**, **Draft**, or
  **Changed**.
- **Duplicate paths** and **orphaned pages** appear in warning panels, each
  with a direct **Open** action.

---

## Technology Overview

- **Framework:** Contentful App Framework
- **UI:** React + Forma 36
- **Build Tool:** Vite
- **Testing:** Vitest
- **Hosting:** Contentful-hosted app bundles (via `@contentful/app-scripts`)

---

## Local Development

### Requirements

- Node.js **20 (LTS "Iron")** — the marketplace monorepo pins this at its root (`.nvmrc` = `lts/iron`); Node ≥ 18 and < 22
- npm ≥ 9 and < 11

### Install dependencies

```bash
npm ci
```

### Run locally

```bash
npm run dev
```

---

## Build

```bash
npm run build
```

Builds a production-ready bundle into the `build/` directory.

---

## Uploading to Contentful

> For Marketplace releases you do **not** run these commands — deployment is
> handled by the monorepo's `release-please` pipeline. The commands below are
> for self-hosting the app under your own Contentful organization.

### Interactive upload

```bash
npm run upload
```

### CI upload

```bash
npm run upload-ci
```

Required environment variables:

```bash
CONTENTFUL_ORG_ID=
CONTENTFUL_APP_DEF_ID=
CONTENTFUL_ACCESS_TOKEN=
```

---

## Installation

Installation is handled at the organization level via a Contentful App Definition,
then installed into individual spaces and environments.

See:

```
docs/installation.md
```

---

## Documentation

Additional documentation is available in the `docs/` directory:

- `installation.md` — installation, configuration, and the app-settings reference
- `support.md` — how to get support and contact Aionic

---

## Hosting

PageTree is distributed as a **Contentful-hosted app bundle**: the bundle is
uploaded to Contentful and served from Contentful's CDN via the App Framework.
Security headers (including `frame-ancestors`) and caching are managed by the
Contentful platform.

---

## Dependency security

The **production bundle has no known vulnerabilities** — `npm audit --omit=dev`
reports 0. Remaining advisories are confined to the **dev/build toolchain**
(chiefly `@contentful/app-scripts` and its transitive dependencies); they are
never shipped to end users, and are picked up automatically as the toolchain
publishes patched releases.

---

## Built by Aionic

PageTree is built and maintained by **Aionic**, a digital engineering consultancy
specializing in Contentful, composable architecture, and enterprise CMS platforms.

PageTree is free to use. For teams looking to extend or customize editorial
workflows, Aionic provides advisory and implementation services.

Learn more at:
https://www.aionicdigital.com
