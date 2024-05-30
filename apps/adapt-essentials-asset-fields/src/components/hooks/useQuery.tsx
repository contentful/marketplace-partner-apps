import { useStore } from '../context/createFastContext';
import useActivePage from './useActivePage';
import useSkip from './useSkip';

const useQuery = () => {
  const [query, setStore] = useStore((store) => store['query']);
  const { setActivePage } = useActivePage();
  const { setSkip } = useSkip();

  return {
    query,
    setQuery: (q) => {
      if (query === q) {
        return;
      }

      setSkip(0);
      setActivePage(0);
      setStore({
        query: q,
      });
    },
  };
};

export default useQuery;
