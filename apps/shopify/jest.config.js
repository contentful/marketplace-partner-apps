module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js', '!src/__tests__/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  verbose: true,
  clearMocks: true,
  restoreMocks: true,

  // Transform ES modules to CommonJS for testing
  transform: {
    '^.+\\.js$': [
      'babel-jest',
      {
        presets: [
          [
            '@babel/preset-env',
            {
              targets: { node: 'current' },
              modules: 'commonjs',
            },
          ],
        ],
      },
    ],
  },

  // Don't transform node_modules except for ES module dependencies
  transformIgnorePatterns: ['node_modules/(?!(@shopify/storefront-api-client)/)'],
};
