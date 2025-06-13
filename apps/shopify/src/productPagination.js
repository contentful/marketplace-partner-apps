import { productDataTransformer } from './dataTransformer';
import BasePagination from './basePagination';
import { convertProductToBase64 } from './utils/base64';

const makePagination = async (sdk) => {
  const pagination = new BasePagination({
    sdk,
    dataTransformer: productDataTransformer,
    fetchProducts: async function (search, perPage, after = null) {
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
        query getProducts($first: Int!, $after: String, $query: String) {
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
        first: perPage,
        after,
        query: queryStr,
      };

      const response = await this.shopifyClient.request(query, { variables });

      // Update cursor for next page
      if (response.data.products.pageInfo.hasNextPage) {
        this.lastCursor = response.data.products.pageInfo.endCursor;
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

      return products.map((res) => convertProductToBase64(res));
    },
  });
  await pagination.init();
  return pagination;
};

export default makePagination;
