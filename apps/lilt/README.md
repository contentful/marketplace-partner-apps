# Contentful Lilt Extension

This is a localization job manager for Lilt and Contentful. It is implemented
using Contentful's App Framework.

## User documentation, common asked questions, and HelpDesk access:

https://support.lilt.com/kb/contentful


## Commands

### `npm run start`

Starts the development server and deploys the extension in development mode.

The extension will automatically reload if you make changes to the code.

### `npm run build`

Builds the extension for production to the `build` folder. It correctly
bundles React and all dependencies in production mode and optimizes the build
for the best performance.

### `npm run test`

Runs jest runner. Passes through all flats directly to Jest.

### `npm run login`

Starts new session with our CLI. As the CLI tool uses our Content Management
API, you need to have an CMA access token to use all the commands.

### `npm run logout`

Ends your current session with the CLI tool.

### `npm run configure`

Asks which space and environment you want to use for development and deployment.
It saves your answers to local `.contentfulrc.json`.

**Caution**: Do not commit `.contentfulrc.json` to your repository. It contains
sensitive information and intended to be used only on your local machine.

