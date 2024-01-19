import { useStore } from "../context/createFastContext";

const useEntriesSelection = () => {
  const [selectedEntries, setStore] = useStore(
    (store) => store['selectedEntries']
  );
  const setSelectedEntries = (entries) => setStore({ selectedEntries: entries });
  const setSelected = (id, isSelected) => {
    if (isSelected) {
      setSelectedEntries([...selectedEntries, id]);
    } else {
      setSelectedEntries(selectedEntries.filter((existingId) => existingId !== id));
    }
  };

  return {
    selectedEntries,
    setSelectedEntries,
    setSelected,
  }
}

export default useEntriesSelection;
