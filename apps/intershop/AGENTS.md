# Agent Guide — intershop

## What This App Does
Integrates Intershop Commerce Management (e-commerce platform) with Contentful. Lets editors select Intershop products, categories, and promotions for use in Contentful entries. One of the most location-rich apps in the repo. Published as `intershop-connector`.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Intershop ICM instance URL and credentials |
| `LOCATION_HOME` | `src/locations/Home/` | Home screen widget |
| `LOCATION_PAGE` | `src/locations/Page/` | Full-page Intershop product browser |
| `LOCATION_ENTRY_EDITOR` | `src/locations/EntryEditor/` | Entry-level product association |
| `LOCATION_ENTRY_SIDEBAR` | `src/locations/Sidebar/` | Sidebar showing linked Intershop objects |
| `LOCATION_ENTRY_FIELD` | `src/locations/Field/` | Custom field editor for product selection |
| `LOCATION_DIALOG` | `src/locations/Dialog/` | Product/category/promotion picker dialog |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/f36-image` | Image display for product thumbnails |
| `@contentful/react-apps-toolkit` | `useSDK()`, `useAutoResizer()` |
| `contentful-management` | CMA |

## Source Layout

```
src/
├── App.tsx
├── locations/         # All 7 locations above
├── components/
├── containers/        # Container components (data fetching layer)
└── utils/
```

## Sharp Edges & Invariants

- **Intershop ICM REST API**: Intershop uses a complex REST API with OCGP (Omnichannel Commerce Gateway Protocol) authentication. Credentials are in installation parameters.
- **`containers/`**: data-fetching container components separate API calls from presentation. Add new API integrations here, not in components directly.
- **7 locations**: verify which are actually installed before modifying all. The Dialog location must check `sdk.parameters.invocation` to determine which picker type (product/category/promotion) to render.
- **`@contentful/f36-image`** is used for product thumbnail display.

## Never / Always

- **Never** make Intershop API calls from UI components — use `containers/`.
- **Always** use `useAutoResizer()` in Field, Sidebar, and Dialog locations.
- **Always** check `sdk.parameters.invocation` in Dialog to render the correct picker.
