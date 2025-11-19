import { collectionDataTransformer } from './dataTransformer';
import BasePagination from './basePagination';
import { convertCollectionToBase64 } from './utils/base64';
import { retryWithBackoff } from './utils/retry';

const makePagination = async (sdk) => {
  const pagination = new BasePagination({
    sdk,
    dataTransformer: collectionDataTransformer,
    fetchProducts: async function (search, perPage, after = null) {
      // Add space after wildcards to prevent special character interpretation
      let queryStr = '';
      if (search.length) {
        const searches = [
          `title:* ${search}*`, // partial title match with space
          `title:"${search}"`, // exact title phrase match
          `handle:* ${search}*`, // partial handle match with space
          `handle:"${search}"`, // exact handle phrase match
        ];
        queryStr = searches.join(' OR ');
      }

      const query = `
        query getCollections($first: Int!, $after: String, $query: String) {
          collections(first: $first, after: $after, query: $query, sortKey: TITLE, reverse: true) {
            edges {
              node {
                id
                title
                description
                handle
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

      const response = await retryWithBackoff(async () => {
        const result = await this.shopifyClient.request(query, { variables });

        // Check for GraphQL errors
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          const error = new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
          error.errors = result.errors;
          // Check if errors are retryable
          const hasRetryableError = result.errors.some((err) => {
            const code = err.extensions?.code;
            return code === 'THROTTLED' || code === 'INTERNAL_SERVER_ERROR';
          });
          if (hasRetryableError) {
            throw error;
          }
          // Non-retryable errors should still throw
          throw error;
        }

        return result;
      });

      // Update cursor for next page
      if (response.data.collections.pageInfo.hasNextPage) {
        this.lastCursor = response.data.collections.pageInfo.endCursor;
      }

      // Transform GraphQL response to match expected format
      const collections = response.data.collections.edges.map((edge) => {
        const collection = edge.node;
        // Transform image to match old Buy SDK format
        return {
          ...collection,
          image: collection.image ? { src: collection.image.url } : null,
        };
      });

      return collections.map((collection) => convertCollectionToBase64(collection));
    },
  });
  await pagination.init();
  return pagination;
};

export default makePagination;
