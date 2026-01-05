import { KnownSDK } from '@contentful/app-sdk';

interface AppActionResponse<T> {
  body: T;
  error?: string;
  code?: string;
  message?: string;
}

/**
 * Call a LaunchDarkly API action via the backend
 * Uses Contentful signed requests for authentication - NO API KEY SENT
 *
 * @param sdk The Contentful SDK instance
 * @param action The action to perform (e.g., 'getFlags', 'getProjects')
 * @param params Parameters for the action
 * @returns The response body from LaunchDarkly
 * @throws Error with user-friendly message on failure
 */
export const callAppAction = async <T = unknown>(
  sdk: KnownSDK,
  action: string,
  params: Record<string, unknown>,
): Promise<T> => {
  try {
    const requestBody = { action, params };

    // Get app ID
    const appId = sdk.ids.app;
    if (!appId) {
      throw new Error('Missing app ID - please ensure the app is properly installed');
    }

    // Create signed request through Contentful SDK
    // This proves the request came from a legitimate Contentful installation
    const { additionalHeaders } = await sdk.cma.appSignedRequest.create(
      { appDefinitionId: appId },
      {
        method: 'POST',
        path: '/app-action',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      },
    );

    // Determine backend URL
    const backendUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:9050'  // Local momi server
      : 'https://integrations.launchdarkly.com';  // Production

    // Send signed request to backend (NO API KEY in body or headers)
    const response = await fetch(`${backendUrl}/contentful/api/app-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...additionalHeaders, // Contains Contentful signature
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = (await response.json()) as AppActionResponse<never>;

      // Handle specific error codes with user-friendly messages
      if (error.code === 'INSTALLATION_NOT_FOUND') {
        throw new Error('Please re-configure the app in the configuration screen.');
      }

      if (error.code === 'INVALID_API_KEY') {
        throw new Error('Your API key is invalid. Please update it in the configuration screen.');
      }

      if (error.code === 'STORAGE_ERROR') {
        throw new Error('Service temporarily unavailable. Please try again in a moment.');
      }

      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }

      // Generic error with message from backend
      throw new Error(error.message || error.error || 'Failed to perform action');
    }

    const data = (await response.json()) as AppActionResponse<T> & { status?: number };

    // The server always responds 200 with an envelope containing the upstream status
    if ((data as any)?.status && (data as any).status >= 400) {
      // Check if it's a 401 from LaunchDarkly
      if ((data as any).status === 401) {
        throw new Error('Your API key is invalid. Please update it in the configuration screen.');
      }

      throw new Error((data as any)?.body?.message || (data as any)?.error || 'Request failed');
    }

    return data.body;
  } catch (error) {
    console.error('[appAction] Error:', error);
    throw error;
  }
}; 