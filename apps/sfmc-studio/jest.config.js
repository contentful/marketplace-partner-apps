const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/__tests__/**/*.spec.ts?(x)'],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^d3-(.+)$': '<rootDir>/node_modules/d3-$1/dist/d3-$1.js',
    '^lodash-es$': 'lodash',
  },
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!d3-(array|format|geo))'],
};

module.exports = createJestConfig(customJestConfig);
