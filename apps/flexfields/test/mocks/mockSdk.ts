const mockSdk: any = {
  app: {
    onConfigure: jest.fn(),
    getParameters: jest.fn().mockReturnValueOnce({}),
    setReady: jest.fn(),
    getCurrentState: jest.fn(),
  },
  ids: {
    app: "test-app",
  },
  entry: {
    getSys: () => ({ id: 1 }),
  },
  parameters: {
    installation: {
      rules: [],
    },
  },
  contentType: {
    fields: [],
  },
};

export { mockSdk };
