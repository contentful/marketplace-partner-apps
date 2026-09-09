# PageTree — Installation Guide

This document explains how to install **PageTree** into Contentful using the
Contentful App Framework and the `@contentful/app-scripts` CLI.

> **Marketplace installs:** when PageTree is installed from the Contentful
> Marketplace, the App Definition and hosting are managed by Contentful — you
> can skip the App Definition and upload steps below (sections 1, 3, and 5).
> Those apply only when self-hosting the app under your own organization.

---

## Prerequisites

- Access to a Contentful **Organization**
- Permissions to:
  - Create and manage App Definitions (organization level)
  - Install apps into Spaces and Environments
- A Contentful **Personal Access Token** with App Framework permissions
- Node.js **20 (LTS "Iron")** — the marketplace monorepo runs CI on Node 20 (its root `.nvmrc` is `lts/iron`); requires Node ≥ 18 and < 22

---

## 1. App Definition (Organization Level)

PageTree is managed through a Contentful **App Definition** at the organization level.
This definition is the source of truth for the app’s name, icon, locations, and hosting.

### Create a new App Definition (first-time setup)

```bash
npm run create-app-definition
```

This command:

- Authenticates with Contentful
- Creates a new App Definition in your organization
- Outputs an **App Definition ID**

Save the App Definition ID for later use (CI and automation).

---

### Open an existing App Definition

```bash
npx contentful-app-scripts open-settings
```

This opens the App Definition editor in the Contentful web UI.

---

## 2. Configure the App Definition

In the App Definition editor, configure the following:

### Required fields

- **Name:** PageTree
- **Description:** Visual page hierarchy for Contentful
- **Icon:** Upload the PageTree SVG or provide a public HTTPS URL
- **Hosting:** Contentful-hosted (default)

### Locations

PageTree uses exactly three locations — enable all of them:

- **App configuration screen** (`app-config`) — required; where sources,
  path/title fields, and route prefixes are defined
- **Entry sidebar** (`entry-sidebar`) — shows the page tree rooted at the
  current entry; assign it to your page content types
- **Page** (`page`) — the full sitemap view with search and warnings

  > **Important:** the Page location must be configured with the path
  > **`/sitemap`**. This is the path that the entry sidebar uses when opening
  > the Full Sitemap view (`openCurrentAppPage({ path: "/sitemap?root=…" })`).
  > Using any other path will cause the sidebar link to open a blank page.

If locations have not been added yet, they can be added via CLI:

```bash
npm run add-locations
```

---

## 3. Build and Upload the App Bundle

PageTree is deployed as a Contentful-hosted bundle.

### Build the app

```bash
npm run build
```

This creates a production bundle in the `build/` directory.

### Upload and activate the bundle

```bash
npm run upload
```

This command uploads the bundle and activates it for the App Definition.

---

## 4. Install PageTree into a Space

After a bundle is active, install the app into a space and environment:

```bash
npx contentful-app-scripts install
```

Select the target space and environment when prompted.

---

## 5. CI / Non-interactive Uploads (Optional)

For automated deployments, PageTree supports non-interactive uploads.

### Required environment variables

```bash
CONTENTFUL_ORG_ID=
CONTENTFUL_APP_DEF_ID=
CONTENTFUL_ACCESS_TOKEN=
```

### CI upload command

```bash
npm run upload-ci
```

This uploads and activates a bundle without interactive prompts.

---

## 6. Verification

After installation, verify that:

- PageTree appears under **Apps** in the target space
- The app loads correctly in its configured location(s)
- No permission or configuration errors are displayed

---

## Notes

- App Definitions are **organization-scoped**
- A single App Definition can be installed into multiple spaces and environments
- Bundles are versioned and activated independently of installation

---

## App Configuration Reference

These settings are saved in the app's **installation parameters** via the
Configuration Screen.

| Setting         | Type    | Default   | Description                                                                                                                                                                                                                                                                      |
| --------------- | ------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`       | string  | `""`      | The base URL prepended to entry paths for preview links (e.g. `https://www.example.com`).                                                                                                                                                                                        |
| `locale`        | string  | `"en-US"` | Reserved. Path/title fields are currently read using the space's **default** locale; this value is not yet used for fetching.                                                                                                                                                                                                                                   |
| `sources`       | array   | see below | One or more content-type source definitions (see below).                                                                                                                                                                                                                         |
| `detectOrphans` | boolean | `true`    | When `true` (default), flags entries with an empty path field and pages whose parent URL has no entry behind it. Set to `false` if your implementation intentionally uses orphan records and you want to suppress the warnings. Missing the field entirely is treated as `true`. |

### Source object

Each entry in `sources` describes one Contentful content type that contributes
pages to the tree.

| Field           | Required | Description                                                |
| --------------- | -------- | ---------------------------------------------------------- |
| `contentTypeId` | yes      | The content type ID in Contentful.                         |
| `pathFieldId`   | yes      | The short-text field that stores the URL path or slug.     |
| `titleFieldId`  | no       | The short-text field used as the display name in the tree. |
| `routePrefix`   | no       | A mount path prepended to relative slugs (e.g. `/news`).   |
