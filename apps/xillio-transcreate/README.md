# Xillio Transcreate Contentful App

The Xillio Transcreate Contentful App brings the power of professional translation services directly into the heart of your Contentful workflow. Translate your content efficiently and seamlessly, ensuring that your multilingual projects are delivered with quality and consistency.

For full information about the app, see the Xillio Transcreate documentation [here](https://docs.xill.io/transcreate)

## Available Scripts

In the project directory, you can run:

#### `npm start`

Creates or updates your app definition in Contentful, and runs the app in development mode. Open your app to view it in the browser.

The page will reload if you make edits. You will also see any lint errors in the console.

#### `npm run build`

Builds the app for production to the `dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes. Your app is ready to be deployed!

#### `npm run upload`

Uploads the `dist` folder to Contentful and creates a bundle that is automatically activated. The command guides you through the deployment process and asks for all required arguments. Read [here](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/#deploy-with-contentful) for more information about the deployment process.

#### `npm run upload-ci`

Similar to `npm run upload` it will upload your app to Contentful and activate it. The only difference is that with this command all required arguments are read from the environment variables, for example when you add the upload command to your CI pipeline.

For this command to work, the following environment variables must be set:

- `CONTENTFUL_ORG_ID` - The ID of your organization
- `CONTENTFUL_APP_DEF_ID` - The ID of the app to which to add the bundle
- `CONTENTFUL_ACCESS_TOKEN` - A personal [access token](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/personal-access-tokens)

#### `npm run storybook`

This command starts the Storybook development server, allowing you to view and interact with your app's components in isolation. Storybook is a popular tool for developing UI components in isolation and documenting their behavior.

#### `npm run test:storybook`

This command is used to run the Storybook test suite for the Xillio Transcreate app.

Before running the tests, make sure to run `npm run storybook` and have an active Storybook instance running on port 6006.

#### `npm run test`

This command is used to run the tests for the Xillio Transcreate app.

It can be ran locally, but is intented to be used on a CI server to automate the testing process.

The command makes a static build of Storybook and runs these headless using Playwright.
