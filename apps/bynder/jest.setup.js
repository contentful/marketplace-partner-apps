// Jest setup file for global test configuration
// Mock fetch instead of importing node-fetch
global.fetch = jest.fn();

// Mock console.log to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
};