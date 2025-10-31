import { useState, useCallback } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { callAppAction } from '../utils/appAction';
import { validateFlagData, ValidationResult } from '../utils/validation';
import { CreateFlagData, FeatureFlag } from '../types/launchdarkly';

interface UseFlagCreationReturn {
  createFlag: (projectKey: string, flagData: CreateFlagData) => Promise<FeatureFlag>;
  loading: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
  validateFlag: (flagData: CreateFlagData) => ValidationResult;
  clearError: () => void;
}

export function useFlagCreation(): UseFlagCreationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const sdk = useSDK();

  const validateFlag = useCallback((flagData: CreateFlagData): ValidationResult => {
    const result = validateFlagData(flagData);
    setValidationErrors(result.errors);
    return result;
  }, []);

  const createFlag = useCallback(async (projectKey: string, flagData: CreateFlagData): Promise<FeatureFlag> => {
    setLoading(true);
    setError(null);
    setValidationErrors({});

    try {
      // Validate the flag data first
      const validation = validateFlag(flagData);
      if (!validation.isValid) {
        throw new Error('Validation failed: ' + Object.values(validation.errors).join(', '));
      }

      console.log('[useFlagCreation] Creating flag:', { projectKey, flagData });

      // Call the API to create the flag
      const response = await callAppAction<FeatureFlag>(sdk, 'createFlag', {
        projectKey,
        flagData
      });

      console.log('[useFlagCreation] Flag created successfully:', response);
      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create flag';
      console.error('[useFlagCreation] Error creating flag:', err);
      setError(errorMessage);
      // Surface a more visible error toast through SDK if available
      try {
        const details = errorMessage.includes('distinct')
          ? 'Variation names/values must be unique.'
          : undefined;
        if ((sdk as any)?.notifier) {
          (sdk as any).notifier.error(details ? `${errorMessage} ${details}` : errorMessage);
        }
      } catch {}
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sdk, validateFlag]);

  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors({});
  }, []);

  return {
    createFlag,
    loading,
    error,
    validationErrors,
    validateFlag,
    clearError,
  };
} 