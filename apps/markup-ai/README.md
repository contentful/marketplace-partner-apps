# Markup AI App

A Contentful app that integrates Markup AI's content quality checking capabilities into the Contentful platform.

The app can be installed from [marketplace](https://www.contentful.com/marketplace/markup-ai/)

## Setup

1. Install dependencies:

```bash
npm install
```

## Development

To start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Selecting Markup AI environment in local dev

You can switch the Markup AI platform target without changing source code using Vite env vars:

- `VITE_MARKUPAI_URL` — explicit API base URL. Takes precedence when set.
- `VITE_MARKUPAI_ENV` — one of `dev`, `stage`, or `prod` (default).

Examples (create `.env`):

```bash
# Use explicit URL (highest priority)
VITE_MARKUPAI_URL=https://api.dev.markup.ai

# Or select by environment name
VITE_MARKUPAI_ENV=dev
```

## Testing

To run tests:

```bash
npm test
```

To run tests with coverage:

```bash
npm run test:coverage
```

## Build

To create a production build:

```bash
npm run build
```

The build output will be in the `build` directory.

## API Client

The [@hey-api/openapi-ts](https://heyapi.dev/) package is used to auto-generate the files in `src/api-client`.

DO NOT EDIT THESE FILES DIRECTLY. Instead, with your local dev server running, run `npm openapi-ts` to re-generate the client when you need to make updates.

## License

This project is licensed under the Apache-2.0 License - see the LICENSE file for details.
