# RichText Toolkit

RichText Toolkit is designed to extend the Contentful rich text editing experience using Contentful's SDKs and React components.

## Getting Started

To set up the project locally, follow these steps:
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd richtext-toolkit
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run start
   ```


## Available Scripts

In the project directory, you can run:

#### `npm run start`

Creates or updates your app definition in Contentful, and runs the app in development mode.
Open your app to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

#### `npm run build`

Builds the app for production to the `dist` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
Your app is ready to be deployed!

#### `npm run upload`

Uploads the `dist` folder to Contentful and creates a bundle that is automatically activated.
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

#### `npm run test`
Runs ESLint on the src directory to analyze the code for potential errors, stylistic issues, and to enforce consistent coding standards.

#### `npm run lint`
Executes the test suite using Vitest, a fast and lightweight testing framework, to ensure the code behaves as expected.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Installation and Usage
For documentation on Contentful installation, configuration and usage visit read our [documentation](https://ellavationlabs.com/richtext-toolkit/docs)

## Learn More

[Read more](https://ellavationlabs.com/richtext-toolkit)
