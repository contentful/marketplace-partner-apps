# 🔍 Closest Preview

## Overview

The Closest Preview app helps content authors quickly navigate to a top-level page entry that contains their current component. This is especially useful when you're editing component entries (like Links, Cards, etc.) that don't make sense to preview in isolation.

Instead of struggling to find where a component is used, this app helps you navigate directly to the parent page so you can see your component rendered in context! 🚀

## Why Use This App? 🤔

Imagine you're editing a "Link" component. Previewing it in isolation doesn't show you how it will actually appear on your website. You need to see it in the context of a full page.

This app solves that problem by providing a quick way to navigate to the parent page entry, allowing you to see your component in action.

## Installation 💻

This app was built using [Create Contentful App](https://github.com/contentful/create-contentful-app).

### Install from Marketplace

1. Install the app from the Contentful Marketplace
2. Configure the app for your space
3. Add it as a sidebar component to any non-page content types where you want it to appear

### Important Configuration Note ⚠️

After installing the app, you need to add it to the sidebar of any non-page content types where you want it to appear. This is done through the content type configuration in Contentful.

## Local Development

### Available Scripts

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

## How It Works 🧩

The app traverses the content tree using `links_to_entry` until it identifies an entry with a `slug` field in its content type, assuming that such entries represent "pages." This allows the app to provide quick links to navigate to those pages for accurate previews.

## Support

If you encounter any issues or have questions about this app, please create an issue in the [GitHub repository](https://github.com/contentful/marketplace-partner-apps/issues).

## License

This project is licensed under the MIT License.
