import { useEffect } from 'react';

export const useComponentMountedHandler = (cb: () => void) => {
  useEffect(() => {
    cb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
