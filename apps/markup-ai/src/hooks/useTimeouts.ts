import { useRef, useCallback } from "react";

export const useTimeouts = () => {
  const timeoutRefs = useRef<{ [key: string]: ReturnType<typeof globalThis.setTimeout> }>({});

  const setTimeout = useCallback((key: string, callback: () => void, delay: number) => {
    if (key in timeoutRefs.current) {
      globalThis.clearTimeout(timeoutRefs.current[key]);
    }
    timeoutRefs.current[key] = globalThis.setTimeout(callback, delay);
  }, []);

  const clearTimeout = useCallback((key: string) => {
    if (key in timeoutRefs.current) {
      globalThis.clearTimeout(timeoutRefs.current[key]);
      Reflect.deleteProperty(timeoutRefs.current, key);
    }
  }, []);

  const clearAllTimeouts = useCallback(() => {
    for (const timeout of Object.values(timeoutRefs.current)) {
      globalThis.clearTimeout(timeout);
    }
    timeoutRefs.current = {};
  }, []);

  return {
    setTimeout,
    clearTimeout,
    clearAllTimeouts,
  };
};
