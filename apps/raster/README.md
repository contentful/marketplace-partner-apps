# Raster App

The repository contains the source code for the Raster Contentful App.

#### Raster

Editors sign in to Raster with their own account from the picker. Optionally, on the config screen, you can:

- Pin an organization: its slug, after `raster.app/` in its URL. Editors can then only sign in to that organization.
- Save an organization API key that connects every editor without signing in. Create it on your organization's settings page, under "Manage API Access", with Read access to only the libraries editors need: anyone in the space can read it.

#### Contentful - how to configure the application locally

- Go to Apps -> Create App.
- Fill in the Name for your app.
- Set URL to the `localhost:port` if you are starting the app locally from the repository or drag and drop the `build` directory from `apps/raster`
- In the Locations section, check the App configuration screen box.
- Check the Entry field and the JSON object.
- Click the Save button.
- Go to Apps, then select your app and install it to space.
- On the config screen, optionally pin an organization or save an API key.

- You can now create JSON objects fields in your Content Models and select their appearance to be linked to the Raster app.
