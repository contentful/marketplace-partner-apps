# Raster App

The repository contains the source code for the Raster Contentful App.

#### Raster

You will need to generate a read-only API key for Contentful.

- Sign in to your Raster account.
- Select the organization you want to connect to Contentful.
- Go to the Organization Settings page.
- You should see the "Manage API Access" section. You can select which libraries to share with Contentful.

#### Contentful - how to configure the application locally

- Go to Apps -> Create App.
- Fill in the Name for your app.
- Set URL to the `localhost:port` if you are starting the app locally from the repository or drag and drop the `dist` directory from `apps/raster`
- In the Locations section, check the App configuration screen box.
- Check the Entry field and the JSON object.
- Click the Save button.
- Go to Apps, then select your app and install it to space.
- On the config screen fill in all the configuration fields.

- You can now create JSON objects fields in your Content Models and select their appearance to be linked to the Raster app.
