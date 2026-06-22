import { vi } from 'vitest';

// Mock for the Contentful SDK
export const mockSdk = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValue({
      googleDocsClientId: 'test-client-id',
    }),
    getCurrentState: vi.fn().mockReturnValue({
      EditorInterface: {
        controls: [],
      },
    }),
    setReady: vi.fn(),
    locations: {
      LOCATION_ENTRY_FIELD: 'entry-field',
      LOCATION_ENTRY_SIDEBAR: 'entry-sidebar',
      LOCATION_DIALOG: 'dialog',
      LOCATION_ENTRY_EDITOR: 'entry-editor',
      LOCATION_PAGE: 'page',
      LOCATION_HOME: 'home',
    },
  },
  field: {
    getValue: vi.fn(),
    setValue: vi.fn(),
    locale: 'en-US',
    type: 'Symbol',
    id: 'googleDocId',
    validations: [],
  },
  contentType: {
    fields: [
      { id: 'title', name: 'Title', type: 'Symbol' },
      { id: 'description', name: 'Description', type: 'Text' },
    ],
  },
  entry: {
    getSys: () => ({ id: 'test-entry-id' }),
    fields: {
      title: { 'en-US': 'Test Title' },
      description: { 'en-US': 'Test Description' },
    },
  },
  parameters: {
    installation: {
      googleDocsClientId: 'test-client-id',
    },
  },
  ids: {
    app: 'test-app',
    field: 'googleDocId',
    contentType: 'article',
    entry: 'test-entry-id',
    environment: 'master',
    space: 'test-space',
  },
};

// Mock for Contentful Management API
export const mockCma = {
  space: {
    getEnvironment: vi.fn().mockResolvedValue({
      getEntries: vi.fn().mockResolvedValue({
        items: [],
        total: 0,
      }),
      getContentTypes: vi.fn().mockResolvedValue({
        items: [],
        total: 0,
      }),
    }),
  },
};
