import { mockCma } from '../mocks/mockCma';

const mockSdk: any = {
  parameters: {
    installation: {
      serverUrl: 'https://api.growthbook.io',
      apiKey: 'mock-api-key',
      growthbookAPIKey: 'secret_key_123',
    },
  },
  app: {
    onConfigure: jest.fn(),
    getParameters: jest.fn().mockReturnValueOnce({}),
    setReady: jest.fn(),
    getCurrentState: jest.fn(),
  },
  ids: {
    app: 'test-app',
  },
  cma: mockCma,
  entry: {
    fields: {
      experiment: {
        id: 'experiment',
        getValue: jest.fn().mockReturnValue({ 'Add to Cart': 'Add to Cart' }),
        setValue: jest.fn(),
      },
      experimentName: {
        id: 'experimentName',
        getValue: jest.fn().mockReturnValue('testtt'),
        setValue: jest.fn(),
      },
      variations: {
        id: 'variations',
        getValue: jest.fn().mockReturnValue([]),
        setValue: jest.fn(),
      },
      variationNames: {
        id: 'variationNames',
        getValue: jest.fn().mockReturnValue([]),
        setValue: jest.fn(),
      },
      featureFlagId: {
        id: 'featureFlagId',
        getValue: jest.fn().mockReturnValue(''),
        setValue: jest.fn(),
      },
      trackingKey: {
        id: 'trackingKey',
        getValue: jest.fn().mockReturnValue(''),
        setValue: jest.fn(),
      },
    },
  },
};

export { mockSdk };
