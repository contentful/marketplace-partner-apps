import { useStore } from "../context/createFastContext";

const useUser = (id: string) => {
  const [users] = useStore(
    (store) => store['users']
  );
  return users[id];
}

export default useUser;
