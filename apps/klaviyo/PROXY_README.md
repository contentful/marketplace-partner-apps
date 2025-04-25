# Klaviyo Proxy Server for Contentful App

This proxy server is required to work around CORS restrictions when calling Klaviyo's API from a browser-based Contentful app.

## Why a Proxy Server is Needed

Klaviyo's API intentionally blocks CORS requests from browsers as a security measure to prevent exposing private API keys in client-side code. To work around this limitation, we've implemented a simple proxy server that will handle the API requests to Klaviyo on behalf of the Contentful app.

## Setup Instructions

1. Create a `.env` file in the root of the project with the following content:

```
# Contentful App Configuration
CONTENTFUL_APP_HOST=http://localhost:3000

# Klaviyo API Configuration (get from your app parameters)
KLAVIYO_API_KEY=your-klaviyo-api-key

# Proxy Server Configuration
PORT=3001
```

2. Install the dependencies:

```bash
npm install
```

3. Start the development server with the proxy:

```bash
npm run dev-with-proxy
```

This will start both the Contentful app (on port 3000) and the proxy server (on port 3001).

## Production Deployment

In a production environment, you will need to deploy the proxy server alongside the Contentful app. The proxy server should be deployed to a secure server with HTTPS enabled.

### Example Production Configuration:

1. Deploy the proxy server to a hosting service (e.g., Heroku, Vercel, AWS)
2. Set the environment variables in your hosting provider:
   - `CONTENTFUL_APP_HOST`: The URL of your Contentful app
   - `KLAVIYO_API_KEY`: Your Klaviyo API key
   - `PORT`: The port for the proxy server (may be set automatically by the hosting provider)

3. Update the `API_PROXY_URL` in `src/config/klaviyo.ts` to point to your production proxy server URL.

## Security Considerations

- The proxy server should be deployed with HTTPS to ensure secure communication.
- The Klaviyo API key should be stored securely as an environment variable and never exposed to the client.
- CORS is configured to only allow requests from your Contentful app's origin. 