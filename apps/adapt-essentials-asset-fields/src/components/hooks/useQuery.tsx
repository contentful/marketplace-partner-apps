import { useStore } from '../context/createFastContext';

const useQuery = () => {
  const [query, setStore] = useStore((store) => store['query']);
  return {
    query,
    setQuery: (q) => {
      setStore({
        query: q,
      });
    },
  };
};

export default useQuery;
