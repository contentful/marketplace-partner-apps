import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3002',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    indexHtmlFile: 'cypress/support/component-index.html',
    supportFile: 'cypress/support/component.ts',
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },
  },
  env: {
    codeCoverage: {
      exclude: [
        'cypress/**/*.*',
        'src/**/*.cy.{js,jsx,ts,tsx}',
        'src/**/*.test.{js,jsx,ts,tsx}',
      ],
    },
  },
})
