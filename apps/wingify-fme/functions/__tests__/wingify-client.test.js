import WingifyClient from '../wingify-client.js';

describe('WingifyClient', () => {
  const accountId = 'test-account-id';
  const authToken = 'test-auth-token';

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('throws when auth token is missing', () => {
    expect(() => new WingifyClient({ accountId })).toThrow('You have to provide a valid token id');
  });

  it('creates a feature flag via the Wingify API', async () => {
    const featureFlag = { name: 'Test Flag', key: 'test-flag' };
    const apiResponse = { _data: { id: 42 } };

    global.fetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(apiResponse),
    });

    const client = new WingifyClient({ accountId, authToken });
    const result = await client.createFeatureFlag(featureFlag);

    expect(global.fetch).toHaveBeenCalledWith(
      `https://app.wingify.com/api/v2/accounts/${accountId}/features`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(featureFlag),
        headers: {
          'Content-Type': 'application/json',
          token: authToken,
        },
      })
    );
    expect(result).toEqual(apiResponse);
    expect(client.featureId).toBe(42);
  });

  it('fetches a feature flag by id', async () => {
    const featureId = 99;
    const apiResponse = { _data: { id: featureId, name: 'Existing Flag' } };

    global.fetch.mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue(apiResponse),
    });

    const client = new WingifyClient({ accountId, authToken });
    const result = await client.getFeatureFlagById(featureId);

    expect(global.fetch).toHaveBeenCalledWith(
      `https://app.wingify.com/api/v2/accounts/${accountId}/features/${featureId}`,
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          token: authToken,
        },
      })
    );
    expect(result).toEqual(apiResponse);
  });

  it('rejects when the Wingify API rate limit is exceeded', async () => {
    global.fetch.mockResolvedValue({
      status: 429,
      json: jest.fn().mockResolvedValue({}),
    });

    const client = new WingifyClient({ accountId, authToken });

    await expect(client.getFeatureFlagById(1)).rejects.toThrow('Rate limit exceeded. Please try again later.');
  });

  it('updates a feature flag and removes the default variation', async () => {
    const featureFlag = {
      id: 7,
      name: 'Updated Flag',
      variations: [{ id: 1 }, { id: 2, name: 'Variation B' }],
    };
    const apiResponse = { _data: featureFlag };

    global.fetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(apiResponse),
    });

    const client = new WingifyClient({ accountId, authToken });
    await client.updateFeatureFlag(featureFlag);

    expect(global.fetch).toHaveBeenCalledWith(
      `https://app.wingify.com/api/v2/accounts/${accountId}/features/7`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          id: 7,
          name: 'Updated Flag',
          variations: [{ id: 2, name: 'Variation B' }],
        }),
      })
    );
  });

  it('updates variations for a feature flag', async () => {
    const variations = { variations: [{ id: 2, name: 'Variation B' }] };
    const apiResponse = { _data: variations };

    global.fetch.mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue(apiResponse),
    });

    const client = new WingifyClient({ accountId, authToken });
    const result = await client.updateVariations(variations, 7);

    expect(global.fetch).toHaveBeenCalledWith(
      `https://app.wingify.com/api/v2/accounts/${accountId}/features/7`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(variations),
      })
    );
    expect(result).toEqual(apiResponse);
  });
});
