import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import i18n from "../i18n";

interface LocalizationContextType {
  t: (key: string) => string;
  currentLanguage: string;
  changeLanguage: (locale: string) => Promise<void>;
  isInitialized: boolean;
}

const LocalizationContext = createContext<LocalizationContextType | null>(null);

interface LocalizationProviderProps {
  readonly children: ReactNode;
  readonly defaultLocale?: string;
  readonly initializeSync?: boolean;
}

export function LocalizationProvider({
  children,
  defaultLocale = "en",
  initializeSync = false,
}: LocalizationProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<string>(defaultLocale);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize i18next
    const initializeI18n = async () => {
      try {
        const changePromise = i18n.changeLanguage(defaultLocale);
        if (!initializeSync) {
          await changePromise;
        }
        setCurrentLanguage(defaultLocale);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize i18next:", error);
        setIsInitialized(true); // Set to true even on error to prevent infinite loading
      }
    };

    void initializeI18n();
  }, [defaultLocale, initializeSync]);

  const changeLanguage = async (locale: string) => {
    try {
      await i18n.changeLanguage(locale);
      setCurrentLanguage(locale);
    } catch (error) {
      console.error("Failed to change language:", error);
    }
  };

  const t = (key: string): string => {
    return i18n.t(key);
  };

  const contextValue: LocalizationContextType = useMemo(
    () => ({ currentLanguage, changeLanguage, t, isInitialized }),
    [currentLanguage, isInitialized],
  );

  return (
    <LocalizationContext.Provider value={contextValue}>{children}</LocalizationContext.Provider>
  );
}

export function useLocalization(): LocalizationContextType {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within a LocalizationProvider");
  }
  return context;
}

// Convenience hook for just translations
export function useTranslation() {
  const { t, currentLanguage, changeLanguage, isInitialized } = useLocalization();
  return { t, currentLanguage, changeLanguage, isInitialized };
}
