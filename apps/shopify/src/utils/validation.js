import { SHOPIFY_SUPPORTED_API_VERSIONS } from '../constants';

export function validateParameters(parameters) {
  if (parameters.storefrontAccessToken?.length < 1) {
    return 'Provide the storefront access token to your Shopify store.';
  }

  if (parameters.apiEndpoint?.length < 1) {
    return 'Provide the Shopify store URL.';
  }

  if (parameters.apiVersion && !SHOPIFY_SUPPORTED_API_VERSIONS.includes(parameters.apiVersion)) {
    return `Provide a supported Shopify Storefront API version: ${SHOPIFY_SUPPORTED_API_VERSIONS.join(', ')}.`;
  }

  return null;
}
