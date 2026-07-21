jest.mock('../wingify-client.js');
jest.mock('contentful-management', () => ({
  createClient: jest.fn(),
}));

const { handler, initContentfulManagementClient } = require('../handleWingifyCalls.js');
const { createClient } = require('contentful-management');
const { mockCreateFeatureFlag, mockGetFeatureFlagById, mockUpdateFeatureFlag, mockUpdateVariations } = require('../wingify-client.js');

describe('handleWingifyCalls', () => {
  const context = {
    appInstallationParameters: {
      accountId: 'account-123',
      accessToken: 'token-abc',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateFeatureFlag.mockResolvedValue({ success: true, _data: { id: 1 } });
    mockGetFeatureFlagById.mockResolvedValue({ _data: { id: 1 } });
    mockUpdateFeatureFlag.mockResolvedValue({ success: true });
    mockUpdateVariations.mockResolvedValue({ success: true });
    createClient.mockReturnValue({ mocked: true });
  });

  it('returns an error when action is missing', async () => {
    const result = await handler({ body: { payload: '{}' } }, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Action parameter is required');
  });

  it('creates a feature flag', async () => {
    const payload = { name: 'New Flag', key: 'new-flag' };

    const result = await handler(
      {
        body: {
          action: 'create',
          payload: JSON.stringify(payload),
        },
      },
      context
    );

    expect(mockCreateFeatureFlag).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ success: true, _data: { id: 1 } });
  });

  it('returns an error when get action is missing a feature id', async () => {
    const result = await handler(
      {
        body: {
          action: 'get',
          payload: JSON.stringify({}),
        },
      },
      context
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('featureId parameter is required');
    expect(mockGetFeatureFlagById).not.toHaveBeenCalled();
  });

  it('fetches a feature flag by id', async () => {
    const result = await handler(
      {
        body: {
          action: 'get',
          payload: JSON.stringify({ id: 42 }),
        },
      },
      context
    );

    expect(mockGetFeatureFlagById).toHaveBeenCalledWith(42);
    expect(result).toEqual({ _data: { id: 1 } });
  });

  it('updates a feature flag', async () => {
    const payload = { id: 5, name: 'Updated Flag' };

    await handler(
      {
        body: {
          action: 'update',
          payload: JSON.stringify(payload),
        },
      },
      context
    );

    expect(mockUpdateFeatureFlag).toHaveBeenCalledWith(payload);
  });

  it('updates feature flag variations', async () => {
    const payload = {
      featureId: 8,
      variations: [{ id: 2, name: 'Variation B' }],
    };

    await handler(
      {
        body: {
          action: 'updateVariations',
          payload: JSON.stringify(payload),
        },
      },
      context
    );

    expect(mockUpdateVariations).toHaveBeenCalledWith(payload, 8);
  });

  it('returns an error for unsupported actions', async () => {
    const result = await handler(
      {
        body: {
          action: 'delete',
          payload: '{}',
        },
      },
      context
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported action: delete');
  });

  it('returns an error when Wingify credentials are missing', async () => {
    const result = await handler(
      {
        body: {
          action: 'get',
          payload: JSON.stringify({ id: 1 }),
        },
      },
      { appInstallationParameters: {} }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Wingify account ID and Wingify access token');
  });
});

describe('initContentfulManagementClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createClient.mockReturnValue({ mocked: true });
  });

  it('throws when CMA client options are not provided', () => {
    expect(() => initContentfulManagementClient({})).toThrow('Contentful Management API client options');
  });

  it('creates a plain CMA client with space and environment defaults', () => {
    const context = {
      cmaClientOptions: { accessToken: 'cma-token' },
      spaceId: 'space-id',
      environmentId: 'master',
    };

    const client = initContentfulManagementClient(context);

    expect(createClient).toHaveBeenCalledWith(context.cmaClientOptions, {
      type: 'plain',
      defaults: {
        spaceId: 'space-id',
        environmentId: 'master',
      },
    });
    expect(client).toEqual({ mocked: true });
  });
});
