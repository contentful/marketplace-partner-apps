const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: 'test-app',
  },
  dialogs: {
    openCurrentApp: vi.fn().mockResolvedValue({}),
  },
};

export { mockSdk };
