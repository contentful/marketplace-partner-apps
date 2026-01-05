# LaunchDarkly Contentful App

This app lets Contentful editors create/link LaunchDarkly feature flags and map flag variations to Contentful entries.

## Requirements

- Node.js 18+
- npm or yarn
- A LaunchDarkly account (API access)
- A Contentful space with permissions to install apps

## Quick start (local)

```bash
npm install
npm start
```

- App runs at http://localhost:3000
- In Contentful, install the app and point the app URL to http://localhost:3000 during development

## Deploy

```bash
npm run build
# Then upload the ./build bundle
npm run deploy
```

Required environment variables for deploy (set in your shell/CI):

- DEFINITIONS_ORG_ID
- CONTENTFUL_APP_DEF_ID
- CONTENTFUL_CMA_TOKEN

## Configuration in Contentful

During installation/config, you'll provide a LaunchDarkly API token. Recommended permissions:

- Projects (read)
- Environments (read)
- Flags (read, create)

Example custom role policy:

```json
[
  {
    "resources": ["proj/*:env/*:flag/*"],
    "actions": ["createFlag"],
    "effect": "allow"
  },
  {
    "resources": ["proj/*"],
    "actions": ["viewProject"],
    "effect": "allow"
  }
]
```

## Features

- Create new LaunchDarkly flags from Contentful
- Link existing flags to entries
- Map variations to content entries (boolean, string, number, JSON)

## API endpoints used

- Development backend: http://localhost:8080
- Production backend: https://integrations.launchdarkly.com

## Scripts

- npm start – start dev server
- npm run build – build production bundle
- npm run deploy – upload build to Contentful app definition

## Notes

- No .env is required to run; deploy credentials should be provided via environment variables in your shell/CI.
- CRA only exposes env vars prefixed with REACT_APP_. Do not embed secrets in the client.

## License

See LICENSE.
