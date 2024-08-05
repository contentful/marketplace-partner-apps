const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
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
  editor: {
    getLocaleSettings: () => ({}),
    onLocaleSettingsChanged: () => {},
    onShowHiddenFieldsChanged: () => {},
  },
};

export { mockSdk };
