import { useStore } from '../context/createFastContext';

const useOrder = () => {
  const [order, setStore] = useStore((store) => store['order']);
  const { by, direction } = order;

  return {
    by,
    direction,
    setOrder: (newBy, newDirection) => {
      setStore({
        order: {
          by: newBy,
          direction: newDirection,
        },
      });
    },
    setBy: (newBy) => {
      if (newBy.charAt(0) === '-') {
        setStore({
          order: {
            by: newBy,
            direction: 'desc',
          },
        });
        return;
      }
      setStore({
        order: {
          by: newBy,
          direction,
        },
      });
    },
    setDirection: (newDirection) => {
      if (newDirection === 'desc') {
        setStore({
          order: {
            by: `-${by.replace('-', '')}`,
            direction: newDirection,
          },
        });
        return;
      }
      if (newDirection === 'asc') {
        setStore({
          order: {
            by: by.replace('-', ''),
            direction: newDirection,
          },
        });
        return;
      }
      setStore({
        order: {
          by,
          direction: newDirection,
        },
      });
    },
  };
};

export default useOrder;
