import { createContext, useMemo } from "react";
import { GrowthbookAPI } from "../utils/growthbook";
import { useSDK } from "@contentful/react-apps-toolkit";

interface GrowthbookAPIContextProps {
  growthbookAPI: GrowthbookAPI | null;
}
export const GrowthbookAPIContext = createContext<GrowthbookAPIContextProps>({
  growthbookAPI: null,
});

export const GrowthbookAPIProvider = ({
  children,
}: {
  children: React.ReactElement;
}) => {
  const sdk = useSDK();
  const growthbookAPI = useMemo(
    () =>
      new GrowthbookAPI(
        sdk.parameters.installation.growthbookServerUrl,
        sdk.parameters.installation.growthbookAPIKey
      ),
    [
      sdk.parameters.installation.growthbookServerUrl,
      sdk.parameters.installation.growthbookAPIKey,
    ]
  );

  return (
    <GrowthbookAPIContext.Provider value={{ growthbookAPI: growthbookAPI }}>
      {children}
    </GrowthbookAPIContext.Provider>
  );
};
