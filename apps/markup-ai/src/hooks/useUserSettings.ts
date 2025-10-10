import { useEffect, useState, useCallback } from 'react';
import {
  getUserSettings,
  setApiKey,
  setDialect,
  setTone,
  setStyleGuide,
  UserSettings,
  ensureDefaultUserSettings,
} from '../utils/userSettings';

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    if (typeof globalThis !== 'undefined') {
      ensureDefaultUserSettings();
    }
    return getUserSettings();
  });

  useEffect(() => {
    const onStorage = () => setSettings(getUserSettings());
    globalThis.addEventListener('storage', onStorage);
    return () => globalThis.removeEventListener('storage', onStorage);
  }, []);

  const updateApiKey = useCallback((apiKey: string | null) => {
    setApiKey(apiKey);
    setSettings(getUserSettings());
  }, []);

  const updateDialect = useCallback((dialect: string | null) => {
    setDialect(dialect);
    setSettings(getUserSettings());
  }, []);

  const updateTone = useCallback((tone: string | null) => {
    setTone(tone);
    setSettings(getUserSettings());
  }, []);

  const updateStyleGuide = useCallback((styleGuide: string | null) => {
    setStyleGuide(styleGuide);
    setSettings(getUserSettings());
  }, []);

  return {
    settings,
    updateApiKey,
    updateDialect,
    updateTone,
    updateStyleGuide,
  };
}
