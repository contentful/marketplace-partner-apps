/**
 * ConfigDataContext - Provides constants and style guides to all components
 * Makes API calls once and caches results to avoid redundant requests
 */

import React, { createContext, useContext, useMemo } from "react";
import { useGetAdminConstants, useListStyleGuides } from "../hooks/useStyleAndBrandAgent";
import { useUserSettings } from "../hooks/useUserSettings";
import type { ConstantsResponse, StyleGuideResponse } from "../api-client/types.gen";

export type ConfigDataContextType = {
  constants: ConstantsResponse | undefined;
  styleGuides: StyleGuideResponse[] | undefined;
  isLoading: boolean;
  error: Error | null;
};

const ConfigDataContext = createContext<ConfigDataContextType | null>(null);

interface ConfigDataProviderProps {
  children: React.ReactNode;
}

export function ConfigDataProvider({ children }: Readonly<ConfigDataProviderProps>) {
  const { effectiveSettings } = useUserSettings();

  // Create minimal config with just API key for fetching constants and style guides
  const minimalConfig = useMemo(
    () => ({
      apiKey: effectiveSettings.apiKey || "",
    }),
    [effectiveSettings.apiKey],
  );

  // Fetch constants and style guides in parallel (React Query handles this)
  const constantsQuery = useGetAdminConstants(minimalConfig);
  const styleGuidesQuery = useListStyleGuides(minimalConfig);

  const contextValue: ConfigDataContextType = useMemo(
    () => ({
      constants: constantsQuery.data,
      styleGuides: styleGuidesQuery.data,
      isLoading: constantsQuery.isLoading || styleGuidesQuery.isLoading,
      error: (constantsQuery.error || styleGuidesQuery.error) as Error | null,
    }),
    [
      constantsQuery.data,
      constantsQuery.isLoading,
      constantsQuery.error,
      styleGuidesQuery.data,
      styleGuidesQuery.isLoading,
      styleGuidesQuery.error,
    ],
  );

  return <ConfigDataContext.Provider value={contextValue}>{children}</ConfigDataContext.Provider>;
}

export function useConfigData() {
  const context = useContext(ConfigDataContext);
  if (!context) {
    throw new Error("useConfigData must be used within ConfigDataProvider");
  }
  return context;
}
