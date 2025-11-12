import { useState, useCallback } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';

export interface ErrorState {
  message: string | null;
  details?: any;
}

export const useErrorState = (componentName: string) => {
  const [error, setError] = useState<ErrorState>({ message: null });
  const sdk = useSDK();

  const handleError = useCallback((error: Error | string) => {
    const message = error instanceof Error ? error.message : error;
    setError({ message });
    console.error(`[${componentName}] Error:`, message);
    sdk.notifier.error(message);
  }, [componentName, sdk.notifier]);

  const clearError = useCallback(() => {
    setError({ message: null });
  }, []);

  return {
    error,
    handleError,
    clearError
  };
}; 