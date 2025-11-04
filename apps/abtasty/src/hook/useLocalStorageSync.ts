import { useEffect, useState } from 'react';

export const useLocalStorageSync = () => {
  const [selectedCampaignId, setSelectedCampaign] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    const syncFromStorage = () => {
      setSelectedProject(localStorage.getItem('projectId'));
      setSelectedCampaign(localStorage.getItem('campaignId'));
    };

    syncFromStorage();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'projectId' || e.key === 'campaignId') {
        syncFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', syncFromStorage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', syncFromStorage);
    };
  }, []);

  return { selectedCampaignId, selectedProjectId };
};
