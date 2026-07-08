import ConfigScreen from './ConfigScreen';

const usageExceededError = {
  sys: { type: 'Error', id: 'AccessDenied' },
  message: 'Forbidden',
  details: {
    reasons: [
      'usageExceeded',
      'You do not have permissions to create on ContentType, please contact your administrator for more information.',
    ],
  },
};

const makeSdk = (createContentType) => ({
  locales: { default: 'en-US' },
  notifier: { error: jest.fn() },
  space: {
    createContentType,
    updateContentType: jest.fn().mockResolvedValue({}),
    getContentTypes: jest.fn().mockResolvedValue({ items: [] }),
  },
  app: {
    getCurrentState: jest.fn().mockResolvedValue({ EditorInterface: {} }),
  },
});

// onConfigure only reads this.props / this.state, so we can drive it on a bare
// instance without mounting the component or running componentDidMount.
const makeInstance = (sdk) => {
  const instance = new ConfigScreen({ accessToken: 'token', sdk });
  instance.setState = (updater) => {
    const next = typeof updater === 'function' ? updater(instance.state) : updater;
    instance.state = { ...instance.state, ...next };
  };
  return instance;
};

describe('ConfigScreen.onConfigure', () => {
  it('surfaces a content-type-limit error instead of failing silently when createContentType is rejected with usageExceeded', async () => {
    const sdk = makeSdk(jest.fn().mockRejectedValue(usageExceededError));
    const instance = makeInstance(sdk);

    const result = await instance.onConfigure();

    // Install must be aborted cleanly, not left to an unhandled rejection.
    expect(result).toBe(false);
    // The user must be told the content-type limit is the cause.
    expect(sdk.notifier.error).toHaveBeenCalledTimes(1);
    expect(sdk.notifier.error.mock.calls[0][0].toLowerCase()).toContain('content type');
  });

  it('returns install target state on the happy path', async () => {
    const sdk = makeSdk(jest.fn().mockResolvedValue({ sys: { id: 'variationFmeContainer' } }));
    const instance = makeInstance(sdk);

    const result = await instance.onConfigure();

    expect(result).not.toBe(false);
    expect(result.targetState.EditorInterface).toHaveProperty('variationFmeContainer');
    expect(sdk.notifier.error).not.toHaveBeenCalled();
  });
});
