# Agent Guide — shopify

## What This App Does
Integrates Shopify with Contentful as a product/collection picker. Lets editors select Shopify products, product variants, and collections for use in Contentful fields via the Storefront API. Published as `@contentful/shopify-sku`.

## Archetype
**Ecommerce base app** — wraps `@contentful/ecommerce-app-base`.

> This is the canonical Shopify app, migrated from `contentful/apps`. The stub in `contentful/apps` redirects here.

## Structure

```
apps/shopify/
└── src/
    ├── index.jsx                  # Mounts ecommerce-app-base (renamed from index.js)
    ├── dataTransformer.js         # Maps Shopify → base-app format
    ├── skuResolvers.js            # Resolves SKUs to product data
    ├── basePagination.js          # Base pagination logic
    ├── productPagination.js       # Product-specific pagination
    ├── collectionPagination.js    # Collection pagination
    ├── productVariantPagination.js # Variant pagination
    ├── constants.js               # Shopify Storefront API constants + API version config
    ├── additionalDataRenderer.jsx # Custom product metadata renderer
    ├── utils/
    │   ├── validation.js          # Input validation for config (API version, credentials)
    │   ├── base64.js
    │   ├── fallback.js
    │   └── retry.js
    └── logo.svg
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/ecommerce-app-base` | Provides entire product picker UI |
| `@contentful/f36-components` | Forma 36 (for additionalDataRenderer) |
| `@contentful/f36-icons` | Icons |
| `@contentful/react-apps-toolkit` | `useSDK()` |

## Sharp Edges & Invariants

- **Shopify Storefront API** (not Admin API) — uses the public Storefront API with a Storefront Access Token. This token has read-only product access and is safe to use in browser-side code. Do not confuse it with the Admin API key.
- **Storefront API version is configurable** — the version (e.g. `2024-01`) is stored in installation parameters and passed to all API requests via `constants.js`. Do not hardcode an API version.
- **`utils/validation.js`**: validates the API version string and credentials at config time — run this before allowing users to save a ConfigScreen with an invalid version format.
- **JSX, not TSX** — all files use `.jsx` or `.js`. TypeScript strictness does not apply.
- **Pagination architecture**: there are four separate pagination modules (`basePagination`, `productPagination`, `collectionPagination`, `productVariantPagination`). Each handles cursor-based GraphQL pagination for its object type. Do not merge or simplify without thorough testing.
- **`dataTransformer.js`**: converts Shopify product/variant/collection objects into the format `ecommerce-app-base` expects. If Shopify's Storefront API changes field names, update this file.
- **`additionalDataRenderer.jsx`**: renders extra product metadata (price, availability) alongside the standard product preview.
- Storefront Access Token is in installation parameters.

## Never / Always

- **Never** use the Shopify Admin API key — use only the Storefront Access Token.
- **Never** switch from cursor-based to offset pagination — Shopify's GraphQL API requires cursors.
- **Always** update `dataTransformer.js` when Shopify's API response shape changes.
