# Contentful Commerce by Commerce Layer

![Contentful Commerce by Commerce Layer](/public/assets//header-light.png#gh-light-mode-only)
![Contentful Commerce by Commerce Layer](/public/assets//header-dark.png#gh-dark-mode-only)

[![Install to Contentful](https://www.ctfstatic.com/button/install-small.svg)](https://app.contentful.com/deeplink?link=apps&id=5AuHBmPgmRNIwuxHhVu9PD&referrer=commercelayer)

## Introduction

Welcome to the Contentful Commerce App, your gateway to integrating a powerful product catalog within Contentful, leveraging the seamless transactional capabilities of Commerce Layer. This app simplifies the process of creating and managing a flexible ecommerce content model, providing you with the tools to curate an engaging and efficient online storefront.

## What is Commerce Layer?

[Commerce Layer](https://commercelayer.io) is a multi-market commerce API and order management system that lets you add global shopping capabilities to any website, mobile app, chatbot, wearable, voice, or IoT device, with ease. Compose your stack with the best-of-breed tools you already mastered and love. Make any experience shoppable, anywhere, through a blazing-fast, enterprise-grade, and secure API.

## Features

- **Custom Content Type Labels**: Personalize the names of your content types to align with your branding and content strategy.
- **Simplified Product Catalog Management**: Manage products, variants, and categories within Contentful's intuitive interface, streamlining your content operations and e-commerce management.
- **Localization Support**: Configure your content types to support multiple languages, making your product catalog globally accessible.

## Installation Guide

To install the Contentful Commerce app in your Contentful space, follow these steps:

1. Navigate to the Contentful Marketplace and locate the Contentful Commerce app.
2. Click on "Install" and follow the prompts to add the app to your space.
3. Once installed, go to the app configuration page within your Contentful space.
4. Customize the labels for your product, variant, taxonomy, and catalog content types as needed.
5. Save your configuration to apply the changes.

Enjoy a cohesive content and commerce experience with Contentful Commerce, built by Commerce Layer.

## Core Concepts

- Catalog: A catalog is a collection of products, often tailored for different markets or seasons. It acts as a container for your product offerings, allowing for organization and easy management within a specific context.
- Taxonomy: A taxonomy is a hierarchical system for classifying and organizing content. It is used to group products into broad categories, such as 'Clothing' or 'Electronics', which can then be broken down into more specific subcategories.
- Taxon: A taxon is an individual category within a taxonomy. Taxons can be nested, allowing you to create a detailed structure for product classification.
- Product: A product represents an individual item for sale. It is the core of your ecommerce catalog and can be associated with multiple variants.
- Variant: A variant is a specific version of a product, which might differ in size, color, or other attributes. Each variant is a unique combination of these attributes and is typically associated with a unique SKU.

## Relationships and Hierarchy

- Products are linked to Variants, which define the different purchasable versions of a product.
- Taxonomies organize Taxons into a hierarchical structure, providing a framework for categorizing products.
- Catalogs group products and their related taxonomies to present a curated collection to the end-user.

## Contribute

> This project was bootstrapped with [Create Contentful App](https://github.com/contentful/create-contentful-app).

### Available scripts

In the project directory, you can run:

#### `pnpm start`

Creates or updates your app definition in Contentful, and runs the app in development mode.
Open your app to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

#### `pnpm run build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
Your app is ready to be deployed!

#### `pnpm run upload`

Uploads the build folder to contentful and creates a bundle that is automatically activated.
The command guides you through the deployment process and asks for all required arguments.
Read [here](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/#deploy-with-contentful) for more information about the deployment process.

#### `pnpm run upload-ci`

Similar to `pnpm run upload` it will upload your app to contentful and activate it. The only difference is  
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

## License

This repository is published under the [MIT](LICENSE) license.
