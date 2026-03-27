# wxrks Contentful App (Frontend)

This app integrates Contentful with wxrks to create translation projects, monitor project status, and fetch translations.

## Overview

The app provides:

- **Entry Sidebar** actions for single-entry project creation and translation sync.
- **App Page** workflows for multi-entry project creation and project tracking.
- **Signed requests** to the backend proxy for request verification.

## Requirements

- Contentful space with app installation permissions.
- wxrks account with **API ID** and **Secret Key**.
- wxrks Connector Configuration UUID (`configUuid`).

## Installation and Configuration

1. Install the app in Contentful.
2. Open **App Configuration**.
3. In **Authentication Settings**:
   - Provide **API ID**.
   - Provide **Secret Key** and click **Test Connection**.
   - Credentials are stored in app installation parameters for space-scoped authentication.
4. In **Project Settings**:
   - Provide Connector Config UUID.
   - Select default workflows.
5. In **Content Model Assignment**:
   - Select the Content Types that should show the wxrks sidebar.
6. Save/Install the app.

## Authentication Model

- Authentication is **space-scoped** and configured once in App Configuration.
- App installation stores API ID and Secret Key in installation parameters.
- Editors do not need to provide credentials individually after the app is configured.

## Available Scripts

- `npm run start` - starts the app in development mode.
- `npm run install-ci` - installs dependencies using `npm ci`.
- `npm run build` - builds app bundle for production proxy path (default build command).
- `npm run build:dev` - builds app bundle for dev proxy path.
- `npm run build:demo` - builds app bundle for demo proxy path.
- `npm run build:prod` - builds app bundle for production proxy path.
- `npm run test` - runs tests in non-watch mode and passes when no tests are present.
- `npm run lint` - lints source files.
- `npm run upload` - uploads build bundle with `contentful-app-scripts`.

## Official Integration Guide (wxrks)

Detailed walkthrough from wxrks:

- [wxrks - Contentful Integration](https://support.wxrks.com/en/articles/10430113-bureau-works-contentful-integration)

## Support

For setup and operational support:

- wxrks Help Center article above (step-by-step guide).
- wxrks support via the Help Center contact flow:
  [wxrks Help Center](https://support.wxrks.com)

## Tech Stack

- React + TypeScript
- Contentful App SDK + React Apps Toolkit
- Forma 36
- Contentful App Scripts

## License

This project is licensed under the MIT License. See the `LICENSE` file.
