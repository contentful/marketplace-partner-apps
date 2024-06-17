import { useStore } from '../context/createFastContext';

const useTotal = () => {
  const [total, setStore] = useStore((store) => store['total']);
  return {
    total,
    setTotal: (newTotal) => {
      setStore({
        total: newTotal,
      });
    },
  };
};

export default useTotal;
