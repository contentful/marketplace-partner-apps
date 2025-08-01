/**
 * VWO Feature Flag Handler
 *
 * This handler manages VWO feature flags through the VWO API.
 * Supports creating, getting, updating feature flags and their variations.
 */

import { createClient } from 'contentful-management';
import VwoClient from './vwo-client.js';

/**
 * Initialize VWO client with authentication
 * @param {Object} context - Provides access to environment variables and other context
 * @returns {VwoClient} Initialized VWO client
 */
function initVwoClient({ accountId, accessToken }) {
  if (!accountId || !accessToken) {
    throw new Error('VWO_ACCOUNT_ID and VWO_AUTH_TOKEN environment variables are required. Please configure them in your app settings.');
  }

  return new VwoClient({
    accountId,
    authToken: accessToken,
    onReauth: () => {
      console.log('VWO authentication failed. Please check your credentials.');
    },
  });
}

/**
 * Initialize Contentful Management Client
 * @param {Object} context - Provides access to environment variables and other context
 * @returns {Object} Initialized Contentful Management Client
 */
export function initContentfulManagementClient(context) {
  if (!context.cmaClientOptions) {
    throw new Error(
      'Contentful Management API client options are only provided for certain function types. To learn more about using the CMA within functions, see https://www.contentful.com/developers/docs/extensibility/app-framework/functions/#using-the-cma.'
    );
  }
  return createClient(context.cmaClientOptions, {
    type: 'plain',
    defaults: {
      spaceId: context.spaceId,
      environmentId: context.environmentId,
    },
  });
}

/**
 * This handler is invoked when your App Action is called
 *
 * @param {Object} event - Contains the parameters passed to your App Action
 * @param {Object} context - Provides access to environment variables and other context information
 * @returns {Object} The response from your App Action
 */
export const handler = async (event, context) => {
  try {
    // Extract parameters from the event body
    const { action, payload } = event.body || {};
    const { accessToken, accountId } = context.appInstallationParameters || {};
    const parsedPayload = JSON.parse(payload) || {};

    // Initialize VWO client
    const vwoClient = initVwoClient({ accountId, accessToken });

    if (!action) {
      return {
        success: false,
        error: 'Action parameter is required. Supported actions: create, get, update, updateVariations',
        timestamp: new Date().toISOString(),
      };
    }

    let result;

    switch (action) {
      case 'create':
        if (!parsedPayload) {
          return {
            success: false,
            error: 'Payload parameter is required for create action',
            timestamp: new Date().toISOString(),
          };
        }
        result = await vwoClient.createFeatureFlag(parsedPayload);
        break;

      case 'get':
        if (!parsedPayload?.id) {
          return {
            success: false,
            error: 'featureId parameter is required for get action',
            timestamp: new Date().toISOString(),
          };
        }
        result = await vwoClient.getFeatureFlagById(parsedPayload.id);
        break;

      case 'update':
        if (!parsedPayload) {
          return {
            success: false,
            error: 'featureFlag parameter is required for update action',
            timestamp: new Date().toISOString(),
          };
        }
        result = await vwoClient.updateFeatureFlag(parsedPayload);
        break;

      case 'updateVariations':
        if (!parsedPayload?.variations || !parsedPayload.featureId) {
          return {
            success: false,
            error: 'variations parameter is required for updateVariations action',
            timestamp: new Date().toISOString(),
          };
        }
        result = await vwoClient.updateVariations(parsedPayload, parsedPayload.featureId);
        break;

      default:
        return {
          success: false,
          error: `Unsupported action: ${action}. Supported actions: create, get, update, updateVariations`,
          timestamp: new Date().toISOString(),
        };
    }

    return result;
  } catch (error) {
    console.error('VWO Feature Flag Handler Error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    };
  }
};
