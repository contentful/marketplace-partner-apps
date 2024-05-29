import React, { useMemo } from "react";
import { locations } from "@contentful/app-sdk";
import ConfigScreen from "./locations/ConfigScreen";
import EntryEditor from "./locations/EntryEditor";
import Sidebar from "./locations/Sidebar";
import { useSDK } from "@contentful/react-apps-toolkit";
import { ExperimentProvider } from "./contexts/ExperimentContext";
import { ContentTypesProvider } from "./contexts/ContentTypesContext";

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: <ConfigScreen />,
  [locations.LOCATION_ENTRY_EDITOR]: (
    <ExperimentProvider>
      <ContentTypesProvider>
        <EntryEditor />
      </ContentTypesProvider>
    </ExperimentProvider>
  ),
  [locations.LOCATION_ENTRY_SIDEBAR]: (
    <ExperimentProvider>
      <Sidebar />
    </ExperimentProvider>
  ),
};

const App = () => {
  const sdk = useSDK();

  const Component = useMemo(() => {
    for (const [location, component] of Object.entries(
      ComponentLocationSettings
    )) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
  }, [sdk.location]);

  return Component ? Component : null;
};

export default App;
