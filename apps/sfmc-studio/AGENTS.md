# Agent Guide — sfmc-studio

## What This App Does
Integrates Salesforce Marketing Cloud (SFMC) with Contentful. Provides analytics and campaign management capabilities — lets editors view SFMC engagement metrics and connect Contentful content to SFMC journeys and emails.

## Archetype
Standard Vite app with significant deviations from the rest of the repo. Published as `sfmc-studio`.

> **Warning**: This app uses **Ant Design** (`antd`) instead of Forma 36, and **Redux Toolkit** for state management. Do not apply standard F36 or Zustand/Context patterns here.

## Structure

```
apps/sfmc-studio/
└── src/
    └── app/               # Next.js-style app directory organization
        ├── components/
        ├── error.tsx
        ├── global-error.tsx
        ├── globals.css
        ├── layout.tsx
        ├── lib/            # SFMC API client and Redux store
        ├── page.tsx
        └── redux/          # Redux Toolkit store and slices
```

## Key Dependencies

| Package | Role |
|---------|------|
| `@ant-design/plots` | Ant Design chart library |
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Minimal F36 usage (structural only) |
| `@contentful/react-apps-toolkit` | `useSDK()` |
| `@reduxjs/toolkit` | State management |
| `antd` | **Ant Design** UI components (primary UI library) |
| `axios` | HTTP client for SFMC API |
| `crypto-js` | Cryptographic utilities (SFMC auth signing) |

## Sharp Edges & Invariants

- **Ant Design, not Forma 36**: use `antd` components for all new UI in this app. Only use F36 for structural SDK wiring. Mixing component libraries will cause style conflicts.
- **Redux Toolkit**: all application state is managed via Redux (`src/app/redux/`). Do not add React context or local component state for shared data — add a Redux slice instead.
- **`crypto-js`**: SFMC uses HMAC-based request signing for some API calls. The crypto logic lives in `src/app/lib/` — do not reimplement signing logic outside this module.
- **SFMC credentials** (client ID, client secret, subdomain) are in installation parameters — never log them.
- **`axios`** is used instead of `fetch` — follow the existing axios interceptor patterns for auth and error handling.

## Never / Always

- **Never** use Forma 36 components for primary UI — use Ant Design.
- **Never** add application state outside Redux.
- **Never** log SFMC credentials or derived tokens.
