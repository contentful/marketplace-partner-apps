const removeHttpsAndTrailingSlash = (url) => {
  const protocol = /^https?:\/\/(www\.)?/;
  const trailingSlash = /\/$/;

  return url.replace(protocol, '').replace(trailingSlash, '');
};

export async function handler(event: any, context: any) {
  const query = `
  query searchProducts($query: String!) {
    search(query: $query, first: 10, types: PRODUCT) {
        edges {
        node {
            ... on Product {
            id
            title
            }
        }
        }
    }
    }
  `;

  const { apiEndpoint, storefrontAccessToken } = context.appInstallationParameters;
  const url = `https://${removeHttpsAndTrailingSlash(apiEndpoint)}/api/2024-10/graphql`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-shopify-storefront-access-token': storefrontAccessToken,
    },
    body: JSON.stringify({ query, variables: { query: '' } }),
  });

  let data = await response.json();

  console.log(data);

  return {
    items: data,
    pages: {},
  };
}
