import { FunctionEvent, FunctionEventContext, FunctionEventHandler } from '@contentful/node-apps-toolkit';

const removeHttpsAndTrailingSlash = (url) => {
  const protocol = /^https?:\/\/(www\.)?/;
  const trailingSlash = /\/$/;

  return url.replace(protocol, '').replace(trailingSlash, '');
};

const extractNodes = (payload: any) => {
  return (
    payload.data?.search?.edges?.map(({ node }) => ({
      name: node.title,
      urn: node.id,
      externalUrl: null,
      image: node.featuredImage,
    })) ?? []
  );
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
      'x-shopify-storefront-access-token': storefrontAccessToken,
    },
    body: JSON.stringify({ query, variables: { ids: event.lookupBy.urns ?? [] } }),
  });
  let data = await response.json();

  console.log(data);
  return {
    items: data.data.nodes,
    pages: {},
  };
}

async function handleSearch(event, context) {
  let nextCursor = event.pages?.nextCursor ?? null;

  const query = `
  query searchProducts($query: String!, $nextCursor: String) {
    search(query: $query, after: $nextCursor, first: 2, types: PRODUCT) {
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
      pageInfo{
        hasNextPage
        endCursor
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
    body: JSON.stringify({ query, variables: { query: event.query ?? '', nextCursor } }),
  });

  let data = await response.json();
  console.log({data})
  if (data.data.search.pageInfo.hasNextPage) {
    nextCursor = data.data.search.pageInfo.endCursor;
  } else {
    nextCursor = undefined;
  }

  return {
    items: extractNodes(data),
    pages: {
      nextCursor,
    },
  };
}

const handler: FunctionEventHandler = async (event, context) => {
  switch (event.type) {
    case 'resources.search': {
      return handleSearch(event, context);
    }
    case 'resources.lookup': {
      return handleLookup(event, context);
    }
  }
};

export { handler };
