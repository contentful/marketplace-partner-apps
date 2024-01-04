import { useStore } from '../context/createFastContext';

const useAssetEntries = () => {
  const [entriesLoading, setStore] = useStore(
    (store) => store['entriesLoading']
  );

  const setIsLoading = (isLoading) => {
    setStore({ entriesLoading: isLoading });
  };

  return { entriesLoading, setIsLoading };
};

export default useAssetEntries;
