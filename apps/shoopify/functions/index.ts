import { FunctionEvent, FunctionEventContext, FunctionEventHandler } from '@contentful/node-apps-toolkit';

const removeHttpsAndTrailingSlash = (url) => {
  const protocol = /^https?:\/\/(www\.)?/;
  const trailingSlash = /\/$/;

  return url.replace(protocol, '').replace(trailingSlash, '');
};

const extractNodes = (payload: any) => {
  return payload.data?.search?.edges?.map(({ node }) => ({
    name: node.title,
    urn: node.id,
    externalUrl: null,
    image: node.featuredImage
  })) ?? [];
};

async function handleLookup(event, context) {
    const query = `query ($ids: [ID!]!) {
                nodes(ids: $ids) {
                    ... on Product {
                    id
                    urn:id
                handle
                description
                title
                image:featuredImage {
                    altText
                        url
                    }
                }
            }
        }`;

    const { apiEndpoint, storefrontAccessToken } = context.appInstallationParameters;
    const url = `https://${removeHttpsAndTrailingSlash(apiEndpoint)}/api/2024-10/graphql`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-shopify-storefront-access-token': storefrontAccessToken
        },
        body: JSON.stringify({ query, variables: { ids: event.lookupBy.urns ?? [] } })
    });
    let data = await response.json();

    console.log(data);
  return {
    items: data.data.nodes,
    pages: {}
  };
}

async function handleSearch(event, context) {
  const query = `
  query searchProducts($query: String!) {
    search(query: $query, first: 10, types: PRODUCT) {
      edges {
        node {
          ... on Product {
            id
            title
            featuredImage {
              url
              altText
            }
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
      'x-shopify-storefront-access-token': storefrontAccessToken
    },
    body: JSON.stringify({ query, variables: { query: event.query ?? '' } })
  });

  let data = await response.json();

  return {
    items: extractNodes(data),
    pages: {}
  };
}

const handler: FunctionEventHandler = async (event, context) => {
  switch (event.type) {
    case 'resources.search': {
      return handleSearch(event, context);
    }
    case 'resources.lookup': {
      return handleLookup(event, context)
    }
  }
};

export { handler };
