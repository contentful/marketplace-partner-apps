// Jest setup file for global configuration and mocks

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Uncomment to silence console.log during tests
  // log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.identity = (x) => x;

// Mock base64 encoding/decoding utilities
global.convertBase64ToString = (base64) => {
  try {
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch (error) {
    throw new Error('Invalid base64 string');
  }
};

global.convertStringToBase64 = (str) => {
  return Buffer.from(str, 'utf-8').toString('base64');
};

// Mock product/collection transformation utilities
global.convertProductToBase64 = (product) => {
  return {
    ...product,
    id: convertStringToBase64(product.id),
  };
};

global.convertCollectionToBase64 = (collection) => {
  return {
    ...collection,
    id: convertStringToBase64(collection.id),
  };
};

// Mock data transformers (these would be imported from actual modules)
global.productDataTransformer = (product, apiEndpoint) => {
  return {
    sku: product.id,
    name: product.title,
    image: product.images?.[0]?.src || '',
    id: product.id,
    apiEndpoint,
  };
};

global.collectionDataTransformer = (collection, apiEndpoint) => {
  return {
    sku: collection.id,
    name: collection.title,
    image: collection.image?.src || '',
    id: collection.id,
    apiEndpoint,
  };
};

global.previewsToProductVariants = (config) => (variant) => {
  return {
    sku: variant.id,
    name: variant.title || variant.product?.title,
    image: variant.image?.src || '',
    id: variant.id,
  };
};

// Mock utility functions
global.difference = (arr1, arr2) => {
  return arr1.filter((x) => !arr2.includes(x));
};

// Set up default environment variables for tests
process.env.NODE_ENV = 'test';
