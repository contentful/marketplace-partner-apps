import last from 'lodash/last';
import uniqBy from 'lodash/uniqBy';
import sortBy from 'lodash/sortBy';
import { productVariantDataTransformer, productsToVariantsTransformer } from './dataTransformer';
import { makeShopifyClient } from './skuResolvers';
import { convertProductToBase64 } from './utils/base64';

const PER_PAGE = 20;

class Pagination {
  freshSearch = true;

  hasNextProductPage = false;
  products = [];
  lastCursor = null;

  variants = [];

  prevSearch = '';

  constructor(sdk) {
    this.sdk = sdk;
  }

  async init() {
    this.shopifyClient = await makeShopifyClient(this.sdk.parameters.installation);
  }

  async fetchNext(search, recursing = false) {
    const searchHasChanged = search !== this.prevSearch;
    const shouldStop = searchHasChanged && recursing;

    if (shouldStop) {
      return;
    }

    if (searchHasChanged) {
      this.prevSearch = search;
      this._resetPagination();
    }

    // If there is a satisfactory size of variants to fill the next
    // page there is no need to fetch any more products and extract their variants
    // until the next click on the "Load more" button
    const nothingLeftToFetch = (!!this.products.length && !this.hasNextProductPage) || (!this.freshSearch && !this.products.length);
    const hasEnoughVariantsToConsume = this.variants.length >= PER_PAGE || nothingLeftToFetch;
    if (hasEnoughVariantsToConsume) {
      const variants = this.variants.splice(0, PER_PAGE);
      return {
        pagination: {
          // There is going to be a next page in the following two complimentary cases:
          // A). There are more products to fetch via the Shopify API
          // B). There are variants left to consume in the in-memory variants list
          hasNextPage: this.hasNextProductPage || this.variants.length > 0,
        },
        products: variants.map(productVariantDataTransformer),
      };
    }

    // When there are not enough variants to fill the page, we need to fetch more products,
    // extract their variants and then call this method recursively to render the next page.
    await this._fetchMoreProducts(search);
    return this.fetchNext(search, true);
  }

  /**
   * This method will either fetch the first batch of products or the next page
   * in the pagination based on the user search and depending on whether the user
   * has already requested an initial batch of products or not
   */
  async _fetchMoreProducts(search) {
    const noProductsFetchedYet = this.products.length === 0;
    const nextProducts = noProductsFetchedYet ? await this._fetchProducts(search) : await this._fetchNextPage(search);

    this.hasNextProductPage = nextProducts.hasNextPage;

    const nextVariants = productsToVariantsTransformer(nextProducts.products || nextProducts);
    this.products = uniqBy([...this.products, ...(nextProducts.products || nextProducts)], 'id');
    this.variants = sortBy(uniqBy([...this.variants, ...nextVariants], 'id'), ['title', 'sku']);

    this.freshSearch = false;
  }

  /**
   * This method is used when the user is fetching products for the first time.
   * i.e. when they just opened the product picker widget or when they just applied
   * a new search term.
   */
  async _fetchProducts(search) {
    // Add space after wildcards to prevent special character interpretation
    let queryStr = '';
    if (search.length) {
      const searches = [
        `title:* ${search}*`, // partial title match with space
        `sku:* ${search}*`, // partial SKU match with space
        `sku:"${search}"`, // exact SKU phrase match
        `title:"${search}"`, // exact title phrase match
        `tag:* ${search}*`, // partial tag match with space
        `tag:"${search}"`, // exact tag phrase match
      ];
      queryStr = searches.join(' OR ');
    }

    const query = `
      query getProductsWithVariants($first: Int!, $after: String, $query: String) {
        products(first: $first, after: $after, query: $query, sortKey: TITLE, reverse: true) {
          edges {
            node {
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
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const variables = {
      first: PER_PAGE,
      after: null,
      query: queryStr,
    };

    const response = await this.shopifyClient.request(query, { variables });

    // Update cursor and hasNextPage for next pagination
    const pageInfo = response.data.products.pageInfo;
    this.hasNextProductPage = pageInfo.hasNextPage;
    if (pageInfo.hasNextPage) {
      this.lastCursor = pageInfo.endCursor;
    }

    // Transform GraphQL response to match expected format
    const products = response.data.products.edges.map((edge) => {
      const product = edge.node;
      // Transform images and variants to match old Buy SDK format
      const images = product.images.edges.map((imgEdge) => ({ src: imgEdge.node.url }));
      const variants = product.variants.edges.map((varEdge) => ({
        ...varEdge.node,
        image: varEdge.node.image ? { src: varEdge.node.image.url } : null,
      }));

      return {
        ...product,
        images,
        variants,
      };
    });

    return products.map((product) => convertProductToBase64(product));
  }

  /**
   * This method is used when the user has already fetched a batch of products
   * and now want to render the next page using cursor-based pagination.
   */
  async _fetchNextPage(search) {
    if (!this.lastCursor) {
      return { products: [], hasNextPage: false };
    }

    // Add space after wildcards to prevent special character interpretation
    let queryStr = '';
    if (search.length) {
      const searches = [
        `title:* ${search}*`, // partial title match with space
        `sku:* ${search}*`, // partial SKU match with space
        `sku:"${search}"`, // exact SKU phrase match
        `title:"${search}"`, // exact title phrase match
        `tag:* ${search}*`, // partial tag match with space
        `tag:"${search}"`, // exact tag phrase match
      ];
      queryStr = searches.join(' OR ');
    }

    const query = `
      query getProductsWithVariants($first: Int!, $after: String, $query: String) {
        products(first: $first, after: $after, query: $query, sortKey: TITLE, reverse: true) {
          edges {
            node {
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
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const variables = {
      first: PER_PAGE,
      after: this.lastCursor,
      query: queryStr,
    };

    const response = await this.shopifyClient.request(query, { variables });

    // Update cursor and hasNextPage for next pagination
    const pageInfo = response.data.products.pageInfo;
    this.hasNextProductPage = pageInfo.hasNextPage;
    if (pageInfo.hasNextPage) {
      this.lastCursor = pageInfo.endCursor;
    }

    // Transform GraphQL response to match expected format
    const products = response.data.products.edges.map((edge) => {
      const product = edge.node;
      // Transform images and variants to match old Buy SDK format
      const images = product.images.edges.map((imgEdge) => ({ src: imgEdge.node.url }));
      const variants = product.variants.edges.map((varEdge) => ({
        ...varEdge.node,
        image: varEdge.node.image ? { src: varEdge.node.image.url } : null,
      }));

      return {
        ...product,
        images,
        variants,
      };
    });

    return {
      products: products.map((product) => convertProductToBase64(product)),
      hasNextPage: pageInfo.hasNextPage,
    };
  }

  _resetPagination() {
    this.products = [];
    this.variants = [];
    this.lastCursor = null;
    this.freshSearch = true;
  }
}

const makePagination = async (sdk) => {
  const pagination = new Pagination(sdk);
  await pagination.init();
  return pagination;
};

export default makePagination;
