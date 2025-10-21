module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/functions'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'functions/**/*.ts',
    '!functions/**/*.d.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  extensionsToTreatAsEsm: [],
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch)/)',
  ],
};