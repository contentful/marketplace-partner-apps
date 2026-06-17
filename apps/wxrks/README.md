# wxrks Contentful App

This repository contains the frontend of the application designed to run within the Contentful platform. The primary objective of this application is to facilitate project creation and integration with wxrks translations, using the resources available in Contentful.

## Available Scripts

In the project directory, you can run:

#### `npm run start`

Runs the app in development mode.
Open your app to view it in the browser.

Your application will be running in [http://localhost:3000](http://localhost:3000).

The page will reload if you make edits.
You will also see any lint errors in the console.

#### `npm run build:dev`

Builds the app for <b>devops</b> to the `build` folder.

#### `npm run build:demo`

Builds the app for <b>demo</b> to the `build` folder.

#### `npm run build:prod`

Builds the app for <b>production</b> to the `build` folder.

It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
Your app is ready to be deployed!

#### `npm run app-definition:dry-run`

Prints the App Definition payload from `contentful-app-definition.json` without calling Contentful.

#### `npm run app-definition:upsert`

Creates or updates the Contentful App Definition from `contentful-app-definition.json`.

Required environment variables:

- `CONTENTFUL_ACCESS_TOKEN`
- `CONTENTFUL_ORG_ID`
- `CONTENTFUL_APP_HOST` to replace the `<host>` placeholder in `contentful-app-definition.json`

Optional environment variable:

- `CONTENTFUL_APP_DEF_ID` or `CONTENTFUL_APP_DEFINITION_ID` to update an existing definition. Without it, the script creates a new definition.

## Libraries to use

To make your app look and feel like Contentful use the following libraries:

- [Forma 36](https://f36.contentful.com/) – Contentful's design system
- [Contentful Field Editors](https://www.contentful.com/developers/docs/extensibility/field-editors/) – Contentful's field editor React components

## Learn More

This project was bootstrapped with [Create Contentful App](https://github.com/contentful/create-contentful-app).

[Read more](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/) and check out the video on how to use the CLI.

Create Contentful App uses [Create React App](https://create-react-app.dev/). You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started) and how to further customize your app.
