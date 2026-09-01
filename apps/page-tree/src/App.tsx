import { useMemo } from "react";
import { locations } from "@contentful/app-sdk";
import tokens from "@contentful/f36-tokens";
import ConfigScreen from "./locations/ConfigScreen";
import Sidebar from "./locations/Sidebar";
import Page from "./locations/Page";
import { useSDK } from "@contentful/react-apps-toolkit";

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
  [locations.LOCATION_PAGE]: Page,
};

const App = () => {
  const sdk = useSDK();

  const Component = useMemo(() => {
    for (const [location, component] of Object.entries(
      ComponentLocationSettings,
    )) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
  }, [sdk.location]);

  return Component ? (
    <Component />
  ) : (
    <div
      style={{
        padding: tokens.spacingM,
        fontFamily: tokens.fontStackPrimary,
        color: tokens.gray700,
      }}
    >
      PageTree: this location is not supported. Enable the app configuration
      screen, entry sidebar, or page location in the App Definition.
    </div>
  );
};

export default App;
