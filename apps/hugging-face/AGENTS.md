# Agent Guide — hugging-face

## What This App Does
Integrates Hugging Face (AI model hub) with Contentful. Lets editors run Hugging Face inference models (text generation, classification, translation, etc.) against Contentful content from a full-page interface.

## Archetype
Standard Vite app.

## Locations

| Location | File | Purpose |
|----------|------|---------|
| `LOCATION_APP_CONFIG` | `src/locations/ConfigScreen.tsx` | Configure Hugging Face API token and default models |
| `LOCATION_PAGE` | `src/locations/Page/` | Full-page model inference UI |

## Key Dependencies

| Package | Role |
|---------|------|
| `@contentful/app-sdk` | App Framework SDK |
| `@contentful/f36-components` | Forma 36 UI |
| `@contentful/react-apps-toolkit` | `useSDK()` |

## Source Layout

```
src/
├── App.tsx
├── locations/         # ConfigScreen, Page
├── components/
├── services/          # Hugging Face Inference API client
└── utils/
```

## Sharp Edges & Invariants

- **Hugging Face API token** is in installation parameters — never log it.
- **`services/`**: all Hugging Face Inference API calls go through the service layer. The Inference API endpoint varies by model — the service must handle this dynamically.
- Hugging Face inference can be slow for large models — the Page location must show clear loading states and handle timeouts gracefully.
- Some Hugging Face models require warm-up time (cold starts) — the first request may take 20–60 seconds.

## Never / Always

- **Never** log the Hugging Face API token.
- **Always** handle Hugging Face model cold-start delays with appropriate loading UI.
