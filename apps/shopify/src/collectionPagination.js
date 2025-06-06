import { collectionDataTransformer } from './dataTransformer';
import BasePagination from './basePagination';
import { convertCollectionToBase64 } from './utils/base64';

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

      const response = await this.shopifyClient.request(query, { variables });

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
