import { useStore } from '../context/createFastContext';

const useActivePage = () => {
  const [activePage, setStore] = useStore((store) => store['activePage']);
  return {
    activePage,
    setActivePage: (newActivePage) => {
      setStore({
        activePage: newActivePage,
      });
    },
  };
};

export default useActivePage;
