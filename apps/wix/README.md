# Wix Integration app

This application is a Contentful app that integrates with Wix.
It can be installed on a Contentful environment and used in order to access Contentful CMS data from a Wix site.

For full information about the integration, see the Contentful on Wix documentation [here](https://wix-incubator.github.io/cli-apps/packages/contentful/).

## Running locally

Install it and run:

```bash
npm install
npm start
# or
yarn
yarn start
```

To test, you can create an app definition in your Contentful organization settings pointing to `http://localhost:3000` and registering both the `app-config` and `page` locations.

Use `.env.template` (rename to `.env`) in order to link you local app to your Contentful account (for Contentful CLI commands).

[Read the docs](https://www.contentful.com/developers/docs/extensibility/app-framework/) for more information.
