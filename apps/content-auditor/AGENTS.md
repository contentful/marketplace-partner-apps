# Agent Guide — content-auditor

## What This App Does
Audits Contentful content for quality issues — broken links, missing required fields, SEO problems, readability scores, and other configurable checks. Provides a full-page dashboard showing audit results across entries in a space.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure audit rules and content types to audit |
| `LOCATION_PAGE` | `src/locations/Page/` | Full-page audit results dashboard |
| `LOCATION_PAGE` | `src/locations/NotFound.tsx` | 404 page for invalid routes |
| `LOCATION_PAGE` | `src/locations/PaginationWithTotal.tsx` | Pagination component for audit results |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()` |
| `contentful` | CDA client — for reading published content |
| `contentful-management` | CMA — for reading entry metadata |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, Page, NotFound, PaginationWithTotal
├── components/
├── lib/               # Audit rule engine and rule implementations
└── styles/
```

## Sharp Edges & Invariants

- **Both CDA and CMA are used**: `contentful` (CDA) is used for reading published content; `contentful-management` (CMA) is used for reading unpublished entries and metadata. These are different clients with different auth tokens — keep them separate.
- **`lib/` is the audit engine**: rule definitions and evaluation logic live here. Adding a new audit rule means implementing the rule interface in `lib/`, not modifying the Page component.
- **Large spaces**: auditing an entire space can involve thousands of entries. Pagination is critical — `PaginationWithTotal` is a shared component for this. Never load all entries at once.
- Audit results are computed client-side — they are not persisted. Each time the Page loads, it re-fetches and re-evaluates.

## Never / Always

- **Never** fetch all entries at once — always use pagination (CDA's `limit`/`skip`, CMA's `limit`/`skip`).
- **Never** use the CDA token for CMA calls or vice versa — they are different auth mechanisms.
