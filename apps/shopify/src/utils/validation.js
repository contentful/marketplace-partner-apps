export function validateParameters(parameters) {
  if (parameters.storefrontAccessToken?.length < 1) {
    return 'Provide the storefront access token to your Shopify store.';
  }

  if (parameters.apiEndpoint?.length < 1) {
    return 'Provide the Shopify store URL.';
  }

  return null;
}
