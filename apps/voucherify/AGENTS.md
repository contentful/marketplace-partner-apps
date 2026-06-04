# Agent Guide — voucherify

## What This App Does
Integrates Voucherify (promotions and loyalty platform) with Contentful. Lets editors browse and link Voucherify campaigns, vouchers, and promotions to Contentful entries. Published as `voucherify-contentful-app`.

## Archetype
Standard Vite app. Uses **JSX, not TSX** and has no `src/locations/` directory — non-standard structure.

## Structure

```
apps/voucherify/
└── src/
    ├── index.jsx           # App entry and location router
    ├── api/                # Voucherify API client
    ├── assets/
    └── components/
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/f36-icons` | Icons |
| `@contentful/react-apps-toolkit` | `useSDK()` |

## Sharp Edges & Invariants

- **JSX, not TSX** — do not add TypeScript without a migration plan.
- **No `src/locations/` directory** — location routing is handled directly in `src/index.jsx`. If adding a new location, follow the existing routing pattern in that file.
- **`src/api/`**: all Voucherify API calls go through this module.
- **Voucherify API credentials** are in installation parameters — never log them.
- The Voucherify REST API requires server-side secret keys for write operations. Verify that this app only uses the public/client key for browser-side reads.

## Never / Always

- **Never** use Voucherify secret keys for browser-side API calls.
- **Never** add TypeScript without a migration plan.
