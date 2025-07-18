// cypress/support/commands.ts
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a custom command for mocking Contentful SDK --
Cypress.Commands.add('mockContentfulSDK', () => {
  cy.window().then((win) => {
    // Mock the Contentful SDK
    (win as any).contentfulExtension = {
      field: {
        getValue: cy.stub().returns(null),
        setValue: cy.stub().resolves(),
      },
      dialogs: {
        openCurrentApp: cy.stub().resolves({
          id: 'test-asset-id',
          url: 'https://test-asset-url.com',
          title: 'Test Asset',
          contentType: 'image/jpeg',
        }),
      },
      window: {
        startAutoResizer: cy.stub(),
        stopAutoResizer: cy.stub(),
      },
      location: {
        is: cy.stub().returns(true),
      },
      parameters: {
        invocation: null,
      },
      close: cy.stub(),
    }

    // Mock OrangeDAMContentBrowser
    ;(win as any).OrangeDAMContentBrowser = {
      open: cy.stub(),
    }
  })
})

// -- This is a custom command for stubbing API calls --
Cypress.Commands.add('interceptAssetAPI', () => {
  cy.intercept('GET', '**/assets/**', {
    fixture: 'assets.json'
  }).as('getAssets')
})
