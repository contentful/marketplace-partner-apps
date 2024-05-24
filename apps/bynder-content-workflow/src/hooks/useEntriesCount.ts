import { useState } from "react";

export default function useEntriesCount() {
  const [entriesCount, setEntriesCount] = useState({
    current: 0,
    total: 0,
  });

  const incrementEntriesCount = () => {
    setEntriesCount((prev) => ({
      ...prev,
      current: prev.current + 1,
    }));
  };

  const setEntriesTotal = (total: number) => {
    setEntriesCount((prev) => ({
      ...prev,
      total,
    }));
  };

  const resetEntriesCount = () => {
    setEntriesCount({
      current: 0,
      total: 0,
    });
  };

  return {
    entriesCount,
    incrementEntriesCount,
    setEntriesTotal,
    resetEntriesCount,
  };
}
