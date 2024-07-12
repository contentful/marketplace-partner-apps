import React, { useMemo } from "react";
import { locations } from "@contentful/app-sdk";
import ConfigScreen from "@/components/locations/ConfigScreen";
import Field from "@/components/locations/Field";
import Dialog from "@/components/locations/Dialog";
import { useSDK } from "@contentful/react-apps-toolkit";

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_DIALOG]: Dialog,
  [locations.LOCATION_ENTRY_FIELD]: Field,
};

function App() {
  const sdk = useSDK();

  const Component = useMemo(() => {
    for (const [location, component] of Object.entries(
      ComponentLocationSettings
    )) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
    return null;
  }, [sdk.location]);

  return Component ? <Component /> : null;
}

export default App;
