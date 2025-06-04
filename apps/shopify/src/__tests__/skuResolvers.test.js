// Mock the Storefront API client before importing other modules
jest.mock('@shopify/storefront-api-client', () => ({
  createStorefrontApiClient: jest.fn(() => ({
    request: jest.fn(),
  })),
}));

// Mock lodash functions
jest.mock('lodash/identity', () => jest.fn((x) => x));
jest.mock('lodash/difference', () => jest.fn((arr1, arr2) => arr1.filter((x) => !arr2.includes(x))));

// Mock the data transformer functions
jest.mock('../dataTransformer', () => ({
  productDataTransformer: jest.fn((product, apiEndpoint) => ({
    sku: product.id,
    name: product.title,
    image: product.images?.[0]?.src || '',
    id: product.id,
    apiEndpoint,
  })),
  collectionDataTransformer: jest.fn((collection, apiEndpoint) => ({
    sku: collection.id,
    name: collection.title,
    image: collection.image?.src || '',
    id: collection.id,
    apiEndpoint,
  })),
  previewsToProductVariants: jest.fn(() => (variant) => ({
    sku: variant.id,
    name: variant.title || variant.product?.title,
    image: variant.image?.src || '',
    id: variant.id,
  })),
  removeHttpsAndTrailingSlash: jest.fn((url) => {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }),
}));

// Mock the base64 utils
jest.mock('../utils/base64', () => ({
  convertStringToBase64: jest.fn((str) => Buffer.from(str).toString('base64')),
  convertBase64ToString: jest.fn((base64) => {
    try {
      return Buffer.from(base64, 'base64').toString('utf-8');
    } catch (error) {
      throw new Error('Invalid base64 string');
    }
  }),
  convertCollectionToBase64: jest.fn((collection) => ({
    ...collection,
    id: Buffer.from(collection.id).toString('base64'),
  })),
  convertProductToBase64: jest.fn((product) => ({
    ...product,
    id: Buffer.from(product.id).toString('base64'),
  })),
}));

// Mock the validation utils
jest.mock('../utils/validation', () => ({
  validateParameters: jest.fn((params) => {
    if (!params.storefrontAccessToken || params.storefrontAccessToken.length < 1) {
      return 'Provide the storefront access token to your Shopify store.';
    }
    if (!params.apiEndpoint || params.apiEndpoint.length < 1) {
      return 'Provide the Shopify store URL.';
    }
    return null;
  }),
}));

// Mock the pagination modules to avoid browser dependencies
jest.mock('../productPagination', () => ({
  default: jest.fn(),
}));
jest.mock('../productVariantPagination', () => ({
  default: jest.fn(),
}));
jest.mock('../collectionPagination', () => ({
  default: jest.fn(),
}));

// Now import the functions we want to test
const { makeShopifyClient, fetchProductPreviews, filterAndDecodeValidIds } = require('../skuResolvers');

describe('makeShopifyClient', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create client with correct configuration', async () => {
    const config = {
      storefrontAccessToken: 'test_token',
      apiEndpoint: 'https://test.myshopify.com',
    };

    const client = await makeShopifyClient(config);
    expect(client).toBeDefined();
    expect(client.request).toBeDefined();
  });

  it('should handle missing storefrontAccessToken', async () => {
    const config = {
      apiEndpoint: 'https://test.myshopify.com',
    };
    await expect(makeShopifyClient(config)).rejects.toThrow('Provide the storefront access token');
  });

  it('should handle missing apiEndpoint', async () => {
    const config = {
      storefrontAccessToken: 'test_token',
    };
    await expect(makeShopifyClient(config)).rejects.toThrow('Provide the Shopify store URL');
  });
});

describe('fetchProductPreviews', () => {
  let mockClient;
  const mockConfig = {
    storefrontAccessToken: 'test_token',
    apiEndpoint: 'https://test.myshopify.com',
  };

  beforeEach(() => {
    const { createStorefrontApiClient } = require('@shopify/storefront-api-client');
    mockClient = {
      request: jest.fn(),
    };
    createStorefrontApiClient.mockReturnValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array for empty SKUs', async () => {
    const result = await fetchProductPreviews([], mockConfig);
    expect(result).toEqual([]);
    expect(mockClient.request).not.toHaveBeenCalled();
  });

  it('should fetch and transform product data correctly', async () => {
    const mockGraphQLResponse = {
      data: {
        nodes: [
          {
            id: 'gid://shopify/Product/1',
            title: 'Test Product',
            description: 'Test Description',
            handle: 'test-product',
            vendor: 'Test Vendor',
            productType: 'Test Type',
            tags: ['tag1', 'tag2'],
            images: {
              edges: [
                {
                  node: {
                    url: 'https://example.com/image.jpg',
                    altText: 'Test Image',
                  },
                },
              ],
            },
            variants: {
              edges: [
                {
                  node: {
                    id: 'gid://shopify/ProductVariant/1',
                    title: 'Default Title',
                    sku: 'TEST-SKU',
                    price: {
                      amount: '10.00',
                      currencyCode: 'USD',
                    },
                    compareAtPrice: {
                      amount: '15.00',
                      currencyCode: 'USD',
                    },
                    availableForSale: true,
                    image: {
                      url: 'https://example.com/variant.jpg',
                      altText: 'Variant Image',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    };

    mockClient.request.mockResolvedValue(mockGraphQLResponse);

    const validProductId = Buffer.from('gid://shopify/Product/1').toString('base64');
    const mockSkus = [validProductId];
    const result = await fetchProductPreviews(mockSkus, mockConfig);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'Test Product',
      sku: expect.any(String),
      image: expect.any(String),
      id: expect.any(String),
    });

    // Ensure quantityAvailable is not present
    expect(result[0]).not.toHaveProperty('quantityAvailable');

    // Verify GraphQL query doesn't contain quantityAvailable
    const query = mockClient.request.mock.calls[0][0];
    expect(query).not.toContain('quantityAvailable');
  });

  it('should handle missing products gracefully', async () => {
    const mockGraphQLResponse = {
      data: {
        nodes: [], // No products found
      },
    };

    mockClient.request.mockResolvedValue(mockGraphQLResponse);

    const validProductId = Buffer.from('gid://shopify/Product/999').toString('base64');
    const mockSkus = [validProductId];
    const result = await fetchProductPreviews(mockSkus, mockConfig);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      isMissing: true,
      name: '',
      image: '',
    });
  });

  it('should handle GraphQL errors gracefully', async () => {
    const mockErrorResponse = {
      errors: [
        {
          message: 'Access denied for quantityAvailable field',
          extensions: { code: 'ACCESS_DENIED' },
        },
      ],
    };

    mockClient.request.mockResolvedValue(mockErrorResponse);

    const validProductId = Buffer.from('gid://shopify/Product/1').toString('base64');
    const mockSkus = [validProductId];

    await expect(fetchProductPreviews(mockSkus, mockConfig)).rejects.toThrow('GraphQL errors');
  });

  it('should transform images from GraphQL format to Buy SDK format', async () => {
    const mockGraphQLResponse = {
      data: {
        nodes: [
          {
            id: 'gid://shopify/Product/1',
            title: 'Test Product',
            images: {
              edges: [{ node: { url: 'https://example.com/image1.jpg' } }, { node: { url: 'https://example.com/image2.jpg' } }],
            },
            variants: { edges: [] },
          },
        ],
      },
    };

    mockClient.request.mockResolvedValue(mockGraphQLResponse);

    // Mock the productDataTransformer to return the transformed product directly
    const { productDataTransformer } = require('../dataTransformer');
    productDataTransformer.mockImplementation((product) => ({
      sku: product.id,
      name: product.title,
      image: product.images?.[0]?.src || '',
      id: product.id,
      images: product.images, // Include the images array
    }));

    const validProductId = Buffer.from('gid://shopify/Product/1').toString('base64');
    const result = await fetchProductPreviews([validProductId], mockConfig);
    const product = result[0];

    // Should transform to Buy SDK format
    expect(product.images).toEqual([{ src: 'https://example.com/image1.jpg' }, { src: 'https://example.com/image2.jpg' }]);
  });
});

describe('filterAndDecodeValidIds', () => {
  it('should filter and decode valid base64 SKUs', () => {
    const validBase64 = Buffer.from('gid://shopify/Product/123').toString('base64');
    const invalidBase64 = 'invalid-sku-format';
    const anotherValid = Buffer.from('gid://shopify/Product/456').toString('base64');

    const skus = [validBase64, invalidBase64, anotherValid];
    const result = filterAndDecodeValidIds(skus, 'Product');

    expect(result).toHaveLength(2);
    expect(result).toContain('gid://shopify/Product/123');
    expect(result).toContain('gid://shopify/Product/456');
    expect(result).not.toContain(invalidBase64);
  });

  it('should filter by SKU type correctly', () => {
    const productId = Buffer.from('gid://shopify/Product/123').toString('base64');
    const variantId = Buffer.from('gid://shopify/ProductVariant/456').toString('base64');
    const collectionId = Buffer.from('gid://shopify/Collection/789').toString('base64');

    const skus = [productId, variantId, collectionId];

    const productResults = filterAndDecodeValidIds(skus, 'Product');
    const variantResults = filterAndDecodeValidIds(skus, 'ProductVariant');
    const collectionResults = filterAndDecodeValidIds(skus, 'Collection');

    expect(productResults).toHaveLength(1);
    expect(variantResults).toHaveLength(1);
    expect(collectionResults).toHaveLength(1);

    expect(productResults[0]).toContain('Product/123');
    expect(variantResults[0]).toContain('ProductVariant/456');
    expect(collectionResults[0]).toContain('Collection/789');
  });

  it('should handle empty input', () => {
    const result = filterAndDecodeValidIds([], 'Product');
    expect(result).toEqual([]);
  });

  it('should handle invalid base64', () => {
    const invalidSkus = ['not-base64', '!!!invalid!!!'];
    const result = filterAndDecodeValidIds(invalidSkus, 'Product');
    expect(result).toEqual([]);
  });
});

describe('Data Transformation - Backwards Compatibility', () => {
  it('should maintain same data structure as Buy SDK', () => {
    // Test that transformed data maintains expected structure
    const mockGraphQLProduct = {
      id: 'gid://shopify/Product/1',
      title: 'Test Product',
      description: 'Test Description',
      vendor: 'Test Vendor',
      productType: 'Test Type',
      tags: ['tag1', 'tag2'],
      images: {
        edges: [{ node: { url: 'https://example.com/image.jpg' } }],
      },
      variants: {
        edges: [
          {
            node: {
              id: 'gid://shopify/ProductVariant/1',
              title: 'Default Title',
              sku: 'TEST-SKU',
              price: { amount: '10.00', currencyCode: 'USD' },
              availableForSale: true,
            },
          },
        ],
      },
    };

    // Transform to match Buy SDK format
    const transformed = {
      ...mockGraphQLProduct,
      images: mockGraphQLProduct.images.edges.map((edge) => ({ src: edge.node.url })),
      variants: mockGraphQLProduct.variants.edges.map((edge) => edge.node),
    };

    // Verify expected structure
    expect(transformed).toHaveProperty('id');
    expect(transformed).toHaveProperty('title');
    expect(transformed).toHaveProperty('description');
    expect(transformed).toHaveProperty('vendor');
    expect(transformed).toHaveProperty('productType');
    expect(transformed).toHaveProperty('tags');
    expect(transformed.images[0]).toHaveProperty('src');
    expect(transformed.variants[0]).toHaveProperty('sku');
    expect(transformed.variants[0]).toHaveProperty('price');

    // Ensure removed field is not present
    expect(transformed).not.toHaveProperty('quantityAvailable');
    expect(transformed.variants[0]).not.toHaveProperty('quantityAvailable');
  });
});
