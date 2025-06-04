import identity from 'lodash/identity';
import difference from 'lodash/difference';
import { createStorefrontApiClient } from '@shopify/storefront-api-client';
import makeProductVariantPagination from './productVariantPagination';
import makeProductPagination from './productPagination';
import makeCollectionPagination from './collectionPagination';
import { productDataTransformer, collectionDataTransformer, removeHttpsAndTrailingSlash } from './dataTransformer';

import { validateParameters } from './utils/validation';
import { previewsToProductVariants } from './dataTransformer';
import { SHOPIFY_API_VERSION, SHOPIFY_ENTITY_LIMIT } from './constants';
import { convertStringToBase64, convertBase64ToString, convertCollectionToBase64, convertProductToBase64 } from './utils/base64';

export async function makeShopifyClient(config) {
  const validationError = validateParameters(config);
  if (validationError) {
    throw new Error(validationError);
  }

  const { storefrontAccessToken, apiEndpoint } = config;

  return createStorefrontApiClient({
    storeDomain: removeHttpsAndTrailingSlash(apiEndpoint),
    apiVersion: SHOPIFY_API_VERSION,
    publicAccessToken: storefrontAccessToken,
  });
}

const graphqlRequest = async (config, query) => {
  const { apiEndpoint, storefrontAccessToken } = config;
  const url = `https://${removeHttpsAndTrailingSlash(apiEndpoint)}/api/${SHOPIFY_API_VERSION}/graphql`;

  const response = await window.fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-shopify-storefront-access-token': storefrontAccessToken,
    },
    body: JSON.stringify({ query }),
  });

  return await response.json();
};

const paginateGraphQLRequest = async (config, ids, queryFunction) => {
  const requests = [];
  for (let i = 0; i < ids.length; i += SHOPIFY_ENTITY_LIMIT) {
    const currentIdPage = ids.slice(i, i + (SHOPIFY_ENTITY_LIMIT - 1));
    const query = queryFunction(currentIdPage);

    requests.push(graphqlRequest(config, query));
  }

  return (await Promise.all(requests)).flatMap((res) => res.data.nodes);
};

// GraphQL query for fetching products by IDs
const productQuery = (validIds) => {
  const queryIds = validIds.map((sku) => `"${sku}"`).join(',');
  return `
    {
      nodes(ids: [${queryIds}]) {
        ... on Product {
          id
          title
          description
          handle
          createdAt
          updatedAt
          vendor
          productType
          tags
          images(first: 10) {
            edges {
              node {
                id
                url
                altText
              }
            }
          }
          variants(first: 250) {
            edges {
              node {
                id
                title
                sku
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                availableForSale
                image {
                  id
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  `;
};

/**
 * Fetches a maximum of 250 previews per request.
 */
const collectionQuery = (validIds) => {
  const queryIds = validIds.map((sku) => `"${sku}"`).join(',');

  /**
   * We select 101 products in order to differentiate between up to 100 items (where we show the exact number)
   * and more than 100 (we don't show the exact number).
   */
  return `
    {
      nodes(ids: [${queryIds}]) {
        id
        ... on Collection {
          handle
          title
          description
          updatedAt
          image {
            url
          }
          products(first: 101) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    }
  `;
};

/**
 * Fetches the collection previews for the collections selected by the user.
 */
export const fetchCollectionPreviews = async (skus, config) => {
  if (!skus.length) {
    return [];
  }

  try {
    const validIds = filterAndDecodeValidIds(skus, 'Collection');

    const response = await paginateGraphQLRequest(config, validIds, collectionQuery);

    // Transform collections to match expected format
    const collections = response
      .map((res) => {
        if (!res) return null;

        // Transform image field from url to src
        const transformedCollection = {
          ...res,
          image: res.image ? { src: res.image.url } : null,
        };

        return convertCollectionToBase64(transformedCollection);
      })
      .filter(Boolean);

    return validIds.map((validId) => {
      const collection = collections.find((collection) => collection?.id === convertStringToBase64(validId));
      return collection
        ? collectionDataTransformer(collection, config.apiEndpoint)
        : {
            sku: convertStringToBase64(validId),
            isMissing: true,
            image: '',
            id: convertStringToBase64(validId),
            name: '',
          };
    });
  } catch (error) {
    console.error('Error in fetchCollectionPreviews:', error);
    throw error;
  }
};

/**
 * Fetches the product previews for the products selected by the user.
 */
export const fetchProductPreviews = async (skus, config) => {
  if (!skus.length) {
    return [];
  }

  try {
    const validIds = filterAndDecodeValidIds(skus, 'Product');
    const shopifyClient = await makeShopifyClient(config);

    const requests = [];
    for (let i = 0; i < validIds.length; i += SHOPIFY_ENTITY_LIMIT) {
      const currentIdPage = validIds.slice(i, i + (SHOPIFY_ENTITY_LIMIT - 1));
      const query = productQuery(currentIdPage);

      requests.push(shopifyClient.request(query));
    }

    const responses = await Promise.all(requests);

    // Check for GraphQL errors
    responses.forEach((response, index) => {
      if (response.errors) {
        console.error(`GraphQL errors in response ${index}:`, response.errors);
        throw new Error(`GraphQL errors: ${JSON.stringify(response.errors)}`);
      }
    });

    const products = responses.flatMap((response) => response.data.nodes).filter(identity);

    // Transform the GraphQL response to match the old Buy SDK format
    const transformedProducts = products
      .map((product) => {
        // Transform images array to match old format
        const images = product.images.edges.map((edge) => ({ src: edge.node.url }));

        // Transform variants array to match old format
        const variants = product.variants.edges.map((edge) => ({
          ...edge.node,
          image: edge.node.image ? { src: edge.node.image.url } : null,
        }));

        return {
          ...product,
          images,
          variants,
        };
      })
      .map((res) => res && convertProductToBase64(res));

    return validIds.map((validId) => {
      const product = transformedProducts.find((product) => product?.id === convertStringToBase64(validId));

      return product
        ? productDataTransformer(product, config.apiEndpoint)
        : {
            sku: convertStringToBase64(validId),
            isMissing: true,
            image: '',
            id: convertStringToBase64(validId),
            name: '',
          };
    });
  } catch (error) {
    console.error('Error in fetchProductPreviews:', error);
    throw error;
  }
};

/**
 * Fetches 250 product variant previews for the product selected by the user.
 */
const productVariantQuery = (validIds) => {
  const queryIds = validIds.map((sku) => `"${sku}"`).join(',');
  return `
    {
      nodes(ids: [${queryIds}]) {
        id
        ... on ProductVariant {
          sku
          image {
            url
          }
          title
          product {
            id
            title
            description
            createdAt
            updatedAt
            vendor
          }
          price {
            amount
            currencyCode
          }
        }
      }
    }
  `;
};

/**
 * Fetches the product variant previews for the product variants selected by the user.
 */
export const fetchProductVariantPreviews = async (skus, config) => {
  if (!skus.length) {
    return [];
  }

  try {
    const validIds = filterAndDecodeValidIds(skus, 'ProductVariant');

    const response = await paginateGraphQLRequest(config, validIds, productVariantQuery);

    // Transform the image field from url to src for compatibility
    const nodes = response.filter(identity).map((node) => {
      const transformedNode = {
        ...node,
        image: node.image ? { src: node.image.url } : null,
      };
      return convertProductToBase64(transformedNode);
    });

    const variantPreviews = nodes.map(previewsToProductVariants(config));
    const missingVariants = difference(
      skus,
      variantPreviews.map((variant) => variant.sku)
    ).map((sku) => ({ sku, isMissing: true, name: '', image: '' }));

    return [...variantPreviews, ...missingVariants];
  } catch (error) {
    console.error('Error in fetchProductVariantPreviews:', error);
    throw error;
  }
};

/**
 * Fetches the product variants searched by the user
 *
 * Shopify does not support indexed pagination, only infinite scrolling
 * @see https://community.shopify.com/c/Shopify-APIs-SDKs/How-to-display-more-than-20-products-in-my-app-when-products-are/td-p/464090 for more details (KarlOffenberger's answer)
 */
export const makeProductVariantSearchResolver = async (sdk) => {
  const pagination = await makeProductVariantPagination(sdk);
  return (search) => pagination.fetchNext(search);
};

export const makeProductSearchResolver = async (sdk) => {
  const pagination = await makeProductPagination(sdk);
  return (search) => pagination.fetchNext(search);
};

export const makeCollectionSearchResolver = async (sdk) => {
  const pagination = await makeCollectionPagination(sdk);
  return (search) => pagination.fetchNext(search);
};

export const filterAndDecodeValidIds = (skus, skuType) => {
  const validIds = skus
    .map((sku) => {
      try {
        // If not valid base64 window.atob will throw
        const decodedId = convertBase64ToString(sku);
        return decodedId;
      } catch (error) {
        return null;
      }
    })
    .filter((decodedId) => decodedId && new RegExp(`^gid://shopify/${skuType}/`).test(decodedId));
  return validIds;
};

/**
 * Selects search resolver based on skuType

 */
export const makeSkuResolver = async (sdk, skuType) => {
  if (skuType === 'product') {
    return makeProductSearchResolver(sdk);
  }

  if (skuType === 'collection') {
    return makeCollectionSearchResolver(sdk);
  }

  return makeProductVariantSearchResolver(sdk);
};
