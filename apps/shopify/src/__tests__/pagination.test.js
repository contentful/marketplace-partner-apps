// Mock dependencies first
jest.mock('@shopify/storefront-api-client', () => ({
  createStorefrontApiClient: jest.fn(() => ({
    request: jest.fn(),
  })),
}));

jest.mock('../skuResolvers', () => ({
  makeShopifyClient: jest.fn(() => ({
    request: jest.fn(),
  })),
}));

jest.mock('../dataTransformer', () => ({
  productDataTransformer: jest.fn((product) => ({
    sku: product.id,
    name: product.title,
    image: '',
    id: product.id,
  })),
  collectionDataTransformer: jest.fn((collection) => ({
    sku: collection.id,
    name: collection.title,
    image: '',
    id: collection.id,
  })),
  productVariantDataTransformer: jest.fn((variant) => ({
    sku: variant.id,
    name: variant.title,
    image: '',
    id: variant.id,
  })),
  productsToVariantsTransformer: jest.fn((products) => []),
}));

jest.mock('../utils/base64', () => ({
  convertProductToBase64: jest.fn((product) => product),
  convertCollectionToBase64: jest.fn((collection) => collection),
}));

describe('Pagination Search Query Generation', () => {
  let mockClient;
  let mockSdk;

  beforeEach(() => {
    mockClient = {
      request: jest.fn(),
    };

    const { makeShopifyClient } = require('../skuResolvers');
    makeShopifyClient.mockResolvedValue(mockClient);

    mockSdk = {
      parameters: {
        installation: {
          storefrontAccessToken: 'test_token',
          apiEndpoint: 'https://test.myshopify.com',
        },
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Product Pagination', () => {
    it('should generate correct search query with spaces after wildcards', async () => {
      const mockResponse = {
        data: {
          products: {
            edges: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      };
      mockClient.request.mockResolvedValue(mockResponse);

      const makePagination = require('../productPagination').default;
      const pagination = await makePagination(mockSdk);

      // Test the search functionality by triggering fetchNext
      await pagination.fetchNext('test-sku');

      // Verify the query was called with correct search parameters
      expect(mockClient.request).toHaveBeenCalledWith(
        expect.stringContaining('query getProducts'),
        expect.objectContaining({
          variables: expect.objectContaining({
            query: 'title:* test-sku* OR sku:* test-sku* OR sku:"test-sku" OR title:"test-sku" OR tag:* test-sku* OR tag:"test-sku"',
          }),
        })
      );
    });

    it('should handle special characters in search terms', async () => {
      const mockResponse = {
        data: {
          products: {
            edges: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      };
      mockClient.request.mockResolvedValue(mockResponse);

      const makePagination = require('../productPagination').default;
      const pagination = await makePagination(mockSdk);

      // Test with SKU containing dashes
      await pagination.fetchNext('sku-managed-1');

      // Verify the query handles special characters properly
      expect(mockClient.request).toHaveBeenCalledWith(
        expect.stringContaining('query getProducts'),
        expect.objectContaining({
          variables: expect.objectContaining({
            query:
              'title:* sku-managed-1* OR sku:* sku-managed-1* OR sku:"sku-managed-1" OR title:"sku-managed-1" OR tag:* sku-managed-1* OR tag:"sku-managed-1"',
          }),
        })
      );
    });

    it('should handle tag-based search terms', async () => {
      const mockResponse = {
        data: {
          products: {
            edges: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      };
      mockClient.request.mockResolvedValue(mockResponse);

      const makePagination = require('../productPagination').default;
      const pagination = await makePagination(mockSdk);

      // Test with tag containing special characters
      await pagination.fetchNext('summer-collection');

      // Verify the query handles tag search properly
      expect(mockClient.request).toHaveBeenCalledWith(
        expect.stringContaining('query getProducts'),
        expect.objectContaining({
          variables: expect.objectContaining({
            query:
              'title:* summer-collection* OR sku:* summer-collection* OR sku:"summer-collection" OR title:"summer-collection" OR tag:* summer-collection* OR tag:"summer-collection"',
          }),
        })
      );
    });

    it('should handle tag-based search with spaces', async () => {
      const mockResponse = {
        data: {
          products: {
            edges: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      };
      mockClient.request.mockResolvedValue(mockResponse);

      const makePagination = require('../productPagination').default;
      const pagination = await makePagination(mockSdk);

      // Test with tag containing spaces
      await pagination.fetchNext('summer sale');

      // Verify the query handles tag search with spaces properly
      expect(mockClient.request).toHaveBeenCalledWith(
        expect.stringContaining('query getProducts'),
        expect.objectContaining({
          variables: expect.objectContaining({
            query: 'title:* summer sale* OR sku:* summer sale* OR sku:"summer sale" OR title:"summer sale" OR tag:* summer sale* OR tag:"summer sale"',
          }),
        })
      );
    });

    it('should generate empty query for empty search', async () => {
      const mockResponse = {
        data: {
          products: {
            edges: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      };
      mockClient.request.mockResolvedValue(mockResponse);

      const makePagination = require('../productPagination').default;
      const pagination = await makePagination(mockSdk);

      await pagination.fetchNext('');

      expect(mockClient.request).toHaveBeenCalledWith(
        expect.stringContaining('query getProducts'),
        expect.objectContaining({
          variables: expect.objectContaining({
            query: '',
          }),
        })
      );
    });
  });

  describe('Collection Pagination', () => {
    it('should generate correct collection search query', async () => {
      const mockResponse = {
        data: {
          collections: {
            edges: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      };
      mockClient.request.mockResolvedValue(mockResponse);

      const makePagination = require('../collectionPagination').default;
      const pagination = await makePagination(mockSdk);

      await pagination.fetchNext('test-collection');

      expect(mockClient.request).toHaveBeenCalledWith(
        expect.stringContaining('query getCollections'),
        expect.objectContaining({
          variables: expect.objectContaining({
            query: 'title:* test-collection* OR title:"test-collection" OR handle:* test-collection* OR handle:"test-collection"',
          }),
        })
      );
    });
  });
});
