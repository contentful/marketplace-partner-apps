# Ceros Contentful App

The Ceros Contentful App lets you embed interactive Ceros experiences directly into the Contentful CMS — no manual copy-pasting of embed codes required. Just paste a published Ceros experience URL and the app automatically pulls the title, canonical URL, and embed code into your Contentful entry, building an organized library of interactive content ready for rapid deployment.

## Features

- **One-step linking** — Paste a published Ceros experience URL and the app fetches and stores all required metadata automatically.
- **Live preview** — A rendered preview of the experience is displayed directly within the Contentful entry editor.
- **Refresh on demand** — If an experience's canvas size or device variants change, refresh the embed code with one click without relinking.
- **Flexible content model** — Map the app to any existing content type, or let the app create a default "Ceros Experience" content type for you.
- **Supports all Ceros experiences** — Works with both `view.ceros.com` and `*.ceros.site` URLs.

## How it works

The app is built on the [Contentful App Framework](https://www.contentful.com/developers/docs/extensibility/app-framework/) and runs in two locations:

**Config Screen** — Installed once per Contentful space. You select (or auto-create) a content type and map three fields to it: a title field (Symbol), a URL field (Symbol), and an embed code field (Text). The app can also register itself as the entry editor for that content type automatically.

**Entry Editor** — Replaces the default editor for entries of the configured content type. When an entry has no linked experience, it shows a URL input form. On submission, the app calls the Ceros [oEmbed](https://oembed.com/) endpoint for that experience using [`@extractus/oembed-extractor`](https://github.com/extractus/oembed-extractor), then writes the returned title, canonical URL, and HTML embed snippet into the configured Contentful fields and saves the entry. Once linked, the editor shows a live preview (rendered by injecting the embed HTML into a container div) along with buttons to unlink or refresh the embed code.

## Development

#### `npm start`

Creates or updates your app definition in Contentful, and runs the app in development mode.
Open your app to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

#### `npm run build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
Your app is ready to be deployed!

#### `npm run upload`

Uploads the build folder to contentful and creates a bundle that is automatically activated.
The command guides you through the deployment process and asks for all required arguments.
Read [here](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/#deploy-with-contentful) for more information about the deployment process.

#### `npm run upload-ci`

Similar to `npm run upload` it will upload your app to contentful and activate it. The only difference is  
that with this command all required arguments are read from the environment variables, for example when you add
the upload command to your CI pipeline.

For this command to work, the following environment variables must be set:

- `CONTENTFUL_ORG_ID` - The ID of your organization
- `CONTENTFUL_APP_DEF_ID` - The ID of the app to which to add the bundle
- `CONTENTFUL_ACCESS_TOKEN` - A personal [access token](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/personal-access-tokens)

## Libraries to use

To make your app look and feel like Contentful use the following libraries:

- [Forma 36](https://f36.contentful.com/) – Contentful's design system
- [Contentful Field Editors](https://www.contentful.com/developers/docs/extensibility/field-editors/) – Contentful's field editor React components

## Using the `contentful-management` SDK

In the default create contentful app output, a contentful management client is
passed into each location. This can be used to interact with Contentful's
management API. For example

```js
// Use the client
cma.locale.getMany({}).then((locales) => console.log(locales));
```

Visit the [`contentful-management` documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/sdk/#using-the-contentful-management-library)
to find out more.

## Learn More

[Read more](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/) and check out the video on how to use the CLI.
