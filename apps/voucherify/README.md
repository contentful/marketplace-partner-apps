# Voucherify App

This repository contains the source code for the Voucherify app.

## Approach

The Voucherify application includes:
- (ConfigScreen) The configuration necessary for the application to work properly.
    - It is required to fill in three fields for the application to connect to Voucherify - `Application ID`, `Secret Key` and `Custom URL`. Within the Configuration Screen, URL validation has been introduced, as well as key verification.

  ![image](https://github.com/contentful/marketplace-partner-apps/assets/117282008/211d2a44-1e8c-4b19-9787-4ce50967f043)

- (FieldView) A place where resources connected to entry are visible. There are three types of Voucherify resources: Campaigns, Earning Rules and Promotion Tiers. If there are connected resources, it is possible to remove the connection between the entry and a specific resource from this level.
  ![image](https://github.com/contentful/marketplace-partner-apps/assets/117282008/9834dd68-ffca-4ff1-9d65-595af9b47514)

- (DialogView) Dialog allows you to search and connect the selected resource to the entry.
  It is possible to connect multiple resources to one entry, as well as to connect multiple entries to one Voucherify resource.
  ![image](https://github.com/contentful/marketplace-partner-apps/assets/117282008/e4a2a739-430b-4faf-9615-9bd8efc532e8)

## Testing steps

### Setting up the application
#### Voucherify
On the Voucherify side, you will need to generate API integration keys for Contentful.

- Go to Project Settings and in the General tab, scroll down to Integration Keys.
- Click the plus button on the right.
- Fill in the Name for your key.
- Choose your role from the Role drop-down list.
- Choose Contentful from the Integration drop-down list.
- Click Create Integration API Key button.

#### Contentful - how to configure the application locally

- Go to Apps -> Create App.
- Fill in the Name for your app.
- Set URL to the `localhost:port` if you are starting the app locally from the repository or drag and drop the `build` directory from `apps/voucherify`
- In the Locations section, check the App configuration screen box.
- Check the Entry field and the JSON object.
- Click the Save button.
- Go to Apps, then select your app and install it to space.
- On the config screen fill in all the configuration fields.
- The Custom URL should look like this: `https://cms-integrations.voucherify.io`. If your project runs on a different server region than EU1, the URL should have the prefix: `https://<region>.cms-integrations.voucherify.io`, for example: `https://us1.cms-integrations.voucherify.io`.
- Click the `Verify Credentials` just to check if the keys and URL are valid or click the  `Install` button right away.

- when the configuration is successful, create your own Content type. To enable displaying the Custom app in your entry, go to the Settings of the Content field, click Appearance and change the display option to your app to allow the entry to be linked to Voucherify.

![image](https://github.com/contentful/marketplace-partner-apps/assets/117282008/d346c8a9-b4c4-435d-ae2c-aa200195df1f)

- At this point you can create your own Entry and connect the Voucherify resources: Campaigns, Earning Rules, and Promotion Tiers to the entries.
  Once integrated, Contentful automatically creates a new metadata array for linked Voucherify campaigns, earning rules, or promotion tiers upon the first connection. Each `contentfulEntity` contains the `Entry ID` and the `contentType`. If a Voucherify resource is linked to several Contentful entries, all those entries will be listed in metadata as `contentfulEntities` with respective `Entry IDs` and `contentTypes`.

Note: after updating the application configuration (if you change the project URL or credentials), you may need to refresh the page to see the current results.
