import { useStore } from '../context/createFastContext';

const useSkip = () => {
  const [skip, setStore] = useStore((store) => store['skip']);
  return {
    skip,
    setSkip: (newSkip) => {
      setStore({
        skip: newSkip,
      });
    },
  };
};

export default useSkip;
