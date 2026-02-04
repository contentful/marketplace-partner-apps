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
import { retryWithBackoff } from './utils/retry';
import { createFallbackPreview } from './utils/fallback';

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

/**
 * Gets the fetch function available in the current environment.
 * Works in both browser and Node.js environments.
 */
const getFetch = () => {
  // Node.js 18+ has global fetch
  if (typeof fetch !== 'undefined') {
    return fetch;
  }
  // Browser environment
  if (typeof window !== 'undefined' && window.fetch) {
    return window.fetch;
  }
  // Fallback: throw error if fetch is not available
  throw new Error('Fetch API is not available in this environment');
};

const graphqlRequest = async (config, query) => {
  const { apiEndpoint, storefrontAccessToken } = config;
  const url = `https://${removeHttpsAndTrailingSlash(apiEndpoint)}/api/${SHOPIFY_API_VERSION}/graphql`;

  return retryWithBackoff(async () => {
    const fetchFn = getFetch();
    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-shopify-storefront-access-token': storefrontAccessToken,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }

    const data = await response.json();
    return data;
  });
};

const paginateGraphQLRequest = async (config, ids, queryFunction) => {
  const requests = [];
  for (let i = 0; i < ids.length; i += SHOPIFY_ENTITY_LIMIT) {
    const currentIdPage = ids.slice(i, i + (SHOPIFY_ENTITY_LIMIT - 1));
    const query = queryFunction(currentIdPage);

    requests.push(graphqlRequest(config, query));
  }

  // Handle partial failures gracefully
  const results = await Promise.allSettled(requests);
  const successfulResults = [];
  const errors = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successfulResults.push(result.value);
    } else {
      console.error(`Request batch ${index} failed:`, result.reason);
      errors.push(result.reason);
    }
  });

  // If all requests failed, throw an error
  if (successfulResults.length === 0 && errors.length > 0) {
    throw new Error(`All requests failed. Last error: ${errors[errors.length - 1].message}`);
  }

  // If some requests failed, log a warning but continue with successful results
  if (errors.length > 0) {
    console.warn(`${errors.length} out of ${requests.length} request batches failed. Continuing with partial results.`);
  }

  return successfulResults.flatMap((res) => res.data?.nodes || []);
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
      return collection ? collectionDataTransformer(collection, config.apiEndpoint) : createFallbackPreview(convertStringToBase64(validId));
    });
  } catch (error) {
    console.error('Error in fetchCollectionPreviews, returning fallback data:', error);
    // Return fallback data for all SKUs
    return skus.map(createFallbackPreview);
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

      // Wrap each request with retry logic
      requests.push(
        retryWithBackoff(async () => {
          return await shopifyClient.request(query);
        })
      );
    }

    // Handle partial failures gracefully
    const results = await Promise.allSettled(requests);
    const successfulResponses = [];
    const errors = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulResponses.push(result.value);
      } else {
        console.error(`Product preview request batch ${index} failed:`, result.reason);
        errors.push(result.reason);
      }
    });

    // If all requests failed, log warning and return fallback data
    if (successfulResponses.length === 0 && errors.length > 0) {
      console.warn(`All product preview requests failed. Returning fallback data for ${skus.length} products.`);
      return skus.map(createFallbackPreview);
    }

    // If some requests failed, log a warning but continue with successful results
    if (errors.length > 0) {
      console.warn(`${errors.length} out of ${requests.length} product preview request batches failed. Continuing with partial results.`);
    }

    const products = successfulResponses.flatMap((response) => response.data?.nodes || []).filter(identity);

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

      return product ? productDataTransformer(product, config.apiEndpoint) : createFallbackPreview(convertStringToBase64(validId));
    });
  } catch (error) {
    console.error('Error in fetchProductPreviews, returning fallback data:', error);
    // Return fallback data for all SKUs
    return skus.map(createFallbackPreview);
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
    ).map(createFallbackPreview);

    return [...variantPreviews, ...missingVariants];
  } catch (error) {
    console.error('Error in fetchProductVariantPreviews, returning fallback data:', error);
    // Return fallback data for all SKUs
    return skus.map(createFallbackPreview);
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
        // If not valid base64, convertBase64ToString will return null
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
