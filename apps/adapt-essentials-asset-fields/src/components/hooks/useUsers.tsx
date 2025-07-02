import { useEffect } from 'react';
import { useCMA } from '@contentful/react-apps-toolkit';

import { useStore } from '../context/createFastContext';

const useUsers = () => {
  const cma = useCMA();
  const [users, setStore] = useStore((store) => store['users']);
  useEffect(() => {
    if (Object.keys(users ?? {}).length > 0) return;
    const getUsers = async () => {
      const users = await cma.user.getManyForSpace({});
      setStore({
        users: users.items.reduce(
          (acc, user) => ({
            ...acc,
            [user.sys.id]: user,
          }),
          {},
        ),
      });
    };
    getUsers();
  }, [cma.user, setStore, users]);

  return users;
};

export default useUsers;
