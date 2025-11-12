import { useRef, useCallback } from 'react';

export const useTimeouts = () => {
  const timeoutRefs = useRef<{ [key: string]: number }>({});

  const setTimeout = useCallback((key: string, callback: () => void, delay: number) => {
    if (timeoutRefs.current[key]) {
      window.clearTimeout(timeoutRefs.current[key]);
    }
    timeoutRefs.current[key] = window.setTimeout(callback, delay);
  }, []);

  const clearTimeout = useCallback((key: string) => {
    if (timeoutRefs.current[key]) {
      window.clearTimeout(timeoutRefs.current[key]);
      delete timeoutRefs.current[key];
    }
  }, []);

  const clearAllTimeouts = useCallback(() => {
    Object.values(timeoutRefs.current).forEach((timeout) => window.clearTimeout(timeout));
    timeoutRefs.current = {};
  }, []);

  return {
    setTimeout,
    clearTimeout,
    clearAllTimeouts,
  };
};
