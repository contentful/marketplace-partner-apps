# Google Gemini Connector

This repository contains a Contentful App which is the AI Actions connector for external Google Gemini models.

## Installation

Install this app into a new organization like this:

1. Fetch npm packages, `npm ci`
   1. Create an app definition with `npm run create-app-definition`
   1. App name: `Google Gemini Connector`
   1. Select where your app can be rendered: Choose `App configuration screen` only
   1. Contentful CMA endpoint URL: Either `api.contentful.com` for a production organization or `api.flinkly.com` for a staging organization
   1. Would you like to specify App Parameter schemas?: `No`
   1. Install the app into a
