# Bynder App

This repository contains the source code for the Bynder app that is on the [marketplace](https://www.contentful.com/marketplace/). 

The app uses Bynder's [Universal Compact View](https://developer-docs.bynder.com/ui-components) to allow a user to select assets from the user's Bynder library and store the selected asset's data provided by Bynder in Contentful.
This app also supports external references and can provide the latest snapshot of stored Bynder assets via GraphQL, as well as asset usage tracking to sync Bynder asset usage information with Contentful entries.

[Demo](https://bynder.github.io/bynder-compactview/) of the Compact View and it's modes.

## Installing
The following will need to be configured on the app configuration page:
 - Provide Bynder URL of your account
 - Select the types assets can be selected
 - Provide "Client ID" and "Client Secret" if you need to use External references and Asset Tracker feature. Information on how to set up OAuth2 client credentials is [here](https://bynder.docs.apiary.io/#reference/oauth-2.0/using-client-credentials). More info on Contentful external references is [here](https://www.contentful.com/developers/docs/concepts/external-references/)
 - Select the Compact View Mode user will use to select their assets. See the [documentation](https://developer-docs.bynder.com/ui-components) for more info on what the various modes do. The `SingleSelectFile` modes must be used if the user needs to select a specific derivative. `MultiSelect` allows a user to select multiple images from the dialog at one time, other modes can select multiple assets however the model must be open per asset selection.

## Additional Features

### External References
The app supports Contentful's External References feature, allowing you to query the latest snapshot of stored Bynder assets via GraphQL. This enables you to retrieve up-to-date asset information directly from Bynder.

**Requirements:**
- Bynder "Client ID" and "Client Secret" must be configured in the app settings
- OAuth2 client credentials from Bynder with appropriate API access privileges (see [setup guide](https://bynder.docs.apiary.io/#reference/oauth-2.0/using-client-credentials))

More information about Contentful external references is available [here](https://www.contentful.com/developers/docs/concepts/external-references/).

### Asset Tracker
The Asset Tracker feature automatically syncs Bynder asset usage information with Contentful entries. When enabled, it tracks when Bynder assets are used in Contentful entries and maintains this usage data in Bynder's Asset Usage API.

**How it works:**
- Automatically creates asset usage records when entries are published
- Updates usage records when entries are modified and republished
- Removes usage records when entries are unpublished, deleted, or archived
- Only tracks assets in the master environment

**Configuration:**
This feature uses Contentful [App Events](https://www.contentful.com/developers/docs/extensibility/app-framework/app-events/) and requires additional setup after installation:
1. Ensure Bynder "Client ID" and "Client Secret" with appropriate privileges are configured in the app settings
2. A Contentful function ([`functions/asset-tracker.ts`](functions/asset-tracker.ts)) is provided as the App Event backend handler
3. After installing the app, you must configure the App Events in Contentful to connect the provided function so it can receive Entry publish, unpublish, delete, and archive events
4. The Bynder OAuth2 credentials must have permissions to access the Asset Usage API

**Note:** Asset tracking only works when Bynder OAuth2 credentials (Client ID and Client Secret) are properly configured with the necessary API privileges, as it requires authenticated access to Bynder's Asset Usage API.

_Updated: Oct 2025 to support external references and asset tracking