const mockSdk: any = {
  app: {
    onConfigure: jest.fn(),
    getParameters: jest.fn().mockReturnValueOnce({}),
    setReady: jest.fn(),
    getCurrentState: jest.fn(),
  },
  ids: {
    app: 'test-app',
  },
  dialogs: {
    openCurrentApp: jest.fn().mockResolvedValue({}),
  },
};

export { mockSdk };
