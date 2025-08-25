import { createClient } from 'contentful-management';
import { globalConstants } from '../utils';

class VwoAppActionService {
  constructor(sdk) {
    this.sdk = sdk;
    this.cma = createClient(
      { apiAdapter: sdk.cmaAdapter },
      {
        type: 'plain',
        defaults: {
          environmentId: sdk.ids.environment,
          spaceId: sdk.ids.space,
        },
      }
    );
    this.actionId = null;
  }

  /**
   * Initialize the service by fetching the app action ID
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const appActions = await this.cma.appAction.getManyForEnvironment({});

      const appAction = appActions.items.find((action) => action.name === globalConstants.VWO_APP_ACTION_NAME);

      if (!appAction) {
        console.warn('App action not found');
        throw new Error('App action not found');
      }

      this.actionId = appAction.sys.id;
    } catch (err) {
      throw new Error(`Failed to initialize VwoAppActionService: ${err.message}`);
    }
  }

  /**
   * Fetch feature flag details from VWO
   * @param {string} featureFlagId - The ID of the feature flag to fetch
   * @returns {Promise<Object>} - Feature flag data with variations
   */
  async fetchFeatureFlag(featureFlagId) {
    try {
      if (!this.actionId) {
        await this.initialize();
      }

      const { response, errors } = await this.cma.appActionCall.createWithResponse(
        {
          appActionId: this.actionId,
          appDefinitionId: this.sdk.ids.app,
          spaceId: this.sdk.ids.space,
          environmentId: this.sdk.ids.environment,
        },
        {
          parameters: {
            action: globalConstants.VWO_GET_FEATURE_FLAG_ACTION,
            payload: JSON.stringify({ id: featureFlagId }),
          },
        }
      );

      if (response.statusCode !== 200) {
        throw new Error('Something went wrong while fetching feature flag details. Please try again');
      }

      const { _data } = JSON.parse(response.body);

      if (_data?.variations) {
        let variations = Array.isArray(_data.variations) ? _data.variations : [_data.variations];
        variations.sort((a, b) => b.id - a.id);
        return { ..._data, variations };
      } else {
        const message = errors?.length ? errors[0].message : 'Something went wrong while fetching feature flag details.';
        throw new Error(message);
      }
    } catch (err) {
      throw new Error(err.message || 'Failed to fetch feature flag');
    }
  }

  /**
   * Create a new feature flag in VWO
   * @param {Object} featureFlag - The feature flag data to create
   * @returns {Promise<Object>} - Created feature flag data
   */
  async createFeatureFlag(featureFlag) {
    try {
      if (!this.actionId) {
        await this.initialize();
      }

      const { response } = await this.cma.appActionCall.createWithResponse(
        {
          appActionId: this.actionId,
          appDefinitionId: this.sdk.ids.app,
          spaceId: this.sdk.ids.space,
          environmentId: this.sdk.ids.environment,
        },
        {
          parameters: {
            action: globalConstants.VWO_CREATE_FEATURE_FLAG_ACTION,
            payload: JSON.stringify(featureFlag),
          },
        }
      );

      if (response.statusCode !== 200) {
        throw new Error('Something went wrong while creating feature flag. Please try again');
      }

      const { _data, _errors } = JSON.parse(response.body);

      if (_data) {
        return _data;
      } else if (_errors) {
        const errorMessage = _errors[0].message ?? 'Something went wrong while creating feature flag. Please try again';
        throw new Error(errorMessage);
      } else {
        throw new Error('Unexpected error while creating feature flag. Please try again');
      }
    } catch (err) {
      throw new Error(err.message || 'Failed to create feature flag');
    }
  }

  /**
   * Update feature flag details in VWO
   * @param {Object} updatedFeatureFlag - The updated feature flag data
   * @returns {Promise<Object>} - Updated feature flag data
   */
  async updateFeatureFlag(updatedFeatureFlag) {
    try {
      if (!this.actionId) {
        await this.initialize();
      }

      const { response } = await this.cma.appActionCall.createWithResponse(
        {
          appActionId: this.actionId,
          appDefinitionId: this.sdk.ids.app,
          spaceId: this.sdk.ids.space,
          environmentId: this.sdk.ids.environment,
        },
        {
          parameters: {
            action: globalConstants.VWO_UPDATE_FEATURE_FLAG_ACTION,
            payload: JSON.stringify(updatedFeatureFlag),
          },
        }
      );

      if (response.statusCode !== 200) {
        throw new Error('Something went wrong while updating feature flag. Please try again');
      }

      const { _data, _errors } = JSON.parse(response.body);

      if (_data) {
        return _data;
      } else if (_errors) {
        throw new Error(_errors[0].message);
      } else {
        throw new Error('Something went wrong while updating Feature flag details. Please try again');
      }
    } catch (err) {
      throw new Error(err.message || 'Failed to update feature flag');
    }
  }

  /**
   * Update variations in VWO
   * @param {Array} vwoVariations - Array of variations to update
   * @returns {Promise<Array>} - Updated variations array
   */
  async updateVariations(vwoVariations, featureId) {
    try {
      if (!this.actionId) {
        await this.initialize();
      }

      if (!featureId) {
        throw new Error('Feature ID is required to update variations');
      }
      const filteredVwoVariations = vwoVariations.filter((variation) => variation.id !== 1);
      const { response } = await this.cma.appActionCall.createWithResponse(
        {
          appActionId: this.actionId,
          appDefinitionId: this.sdk.ids.app,
          spaceId: this.sdk.ids.space,
          environmentId: this.sdk.ids.environment,
        },
        {
          parameters: {
            action: globalConstants.VWO_UPDATE_VARIATIONS_ACTION,
            payload: JSON.stringify({ variations: filteredVwoVariations, featureId }),
          },
        }
      );

      if (response.statusCode !== 200) {
        throw new Error('Something went wrong while updating VWO Variations. Please try again');
      }

      const { _data, _errors } = JSON.parse(response.body);
      if (_data && _data.variations) {
        return _data.variations;
      } else if (_errors) {
        throw new Error(_errors[0].message);
      } else {
        throw new Error('Something went wrong while updating VWO Variations. Please try again');
      }
    } catch (err) {
      throw new Error(err.message || 'Failed to update variations');
    }
  }
}

export default VwoAppActionService;
