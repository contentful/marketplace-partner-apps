# Transifex

Integration with Transifex for Contentful.

This project was bootstrapped with [Create Contentful App](https://github.com/contentful/create-contentful-app).

## Learn More

[Read more](https://www.contentful.com/developers/docs/extensibility/app-framework/create-contentful-app/) and check out the video on how to use the CLI.

Create Contentful App uses [Create React App](https://create-react-app.dev/). You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started) and how to further customize your app.

## Deployment

Local
To upload the bundle of local app to Contentful
`npm install`
`npm run build:development`
`npm run upload`

Staging

To upload the bundle of staging app to Contentful

`npm install`
`npm run build:staging`
`npm run upload`

The staging app can be deployed as

`npm run deploy:staging`


Production

To upload the bundle of staging app to Contentful

`npm install`
`npm run build`
`npm run upload`

The production app can be deployed as

`npm run deploy`
