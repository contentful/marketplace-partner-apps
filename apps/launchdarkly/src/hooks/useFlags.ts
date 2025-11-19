import { useState, useEffect, useCallback } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { callAppAction } from '../utils/appAction';
import { useErrorState } from './useErrorState';
import { FeatureFlag } from '../types/launchdarkly';

export const useFlags = (search: string = '') => {
  const sdk = useSDK();
  const { error, handleError, clearError } = useErrorState('useFlags');
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        setLoading(true);
        clearError();

        // Get project key from parameters (API key is now stored in DynamoDB)
        let projectKey, parameters;

        if ('app' in sdk && typeof sdk.app.getParameters === 'function') {
          parameters = await sdk.app.getParameters();
          projectKey = parameters?.launchDarklyProjectKey;
        } else {
          projectKey = sdk.parameters?.installation?.launchDarklyProjectKey;
          parameters = sdk.parameters?.installation;
        }

        if (!projectKey) {
          handleError('Missing project key - please configure the app first');
          return;
        }

        console.log('[useFlags] Fetching all flags...');
        const result = await callAppAction<{ items: FeatureFlag[] }>(sdk, 'getFlags', {
          projectKey,
        });
        console.log('[useFlags] Received flags count:', result?.items?.length || 0);

        if (result?.items) {
          setFlags(result.items);
          clearError();
        } else {
          handleError('No flags found');
        }
      } catch (err) {
        handleError(err instanceof Error ? err : new Error('Failed to fetch flags'));
      } finally {
        setLoading(false);
      }
    };

    fetchFlags();
  }, [sdk, handleError, clearError, refreshTrigger]);

  const refreshFlags = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const mergeFlag = useCallback((flag: FeatureFlag) => {
    if (!flag || !flag.key) return;
    setFlags(prev => {
      const index = prev.findIndex(f => f.key === flag.key);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...prev[index], ...flag };
        return updated;
      }
      return [flag, ...prev];
    });
  }, []);

  return { flags, loading, error, refreshFlags, mergeFlag };
}; 