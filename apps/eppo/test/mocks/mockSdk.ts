const mockSdk: any = {
  app: {
    onConfigure: jest.fn(),
    getParameters: jest.fn().mockReturnValueOnce({}),
    setReady: jest.fn(),
    getCurrentState: jest.fn(),
  },
  space: {
    getContentTypes: () => Promise.resolve({}),
    createContentType: () => Promise.resolve({}),
    updateContentType: () => Promise.resolve({}),
  },
  window: {
    startAutoResizer: jest.fn(),
  },
  ids: {
    app: 'test-app',
  },
};

export { mockSdk };
