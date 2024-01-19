import { useLocalStorage } from 'use-local-storage-extended';
import { useStore } from '../context/createFastContext';

const useLimit = () => {
  const [storeLimit, setStore] = useStore((store) => store['limit']);
  const [limit, update] = useLocalStorage({
    key: 'limit',
    defaultValue: storeLimit,
  });

  return {
    limit,
    setLimit: (newLimit) => {
      update(newLimit);
      setStore({
        limit: newLimit,
      });
    },
  };
};

export default useLimit;
