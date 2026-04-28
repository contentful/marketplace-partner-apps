import { Suspense, lazy, useMemo } from "react";
import { locations } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { AuthProvider } from "./contexts/AuthContext";
import { ConfigDataProvider } from "./contexts/ConfigDataContext";
// Sidebar is disabled - keeping code for potential future use
// const Sidebar = lazy(() => import("./locations/Sidebar/Sidebar"));
const DialogRouter = lazy(() => import("./locations/Dialog/DialogRouter"));
const ConfigScreen = lazy(() => import("./locations/ConfigScreen/ConfigScreen"));
const Field = lazy(() => import("./locations/Field/Field"));

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  // Sidebar is disabled - keeping code for potential future use
  // [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
  [locations.LOCATION_DIALOG]: DialogRouter,
  [locations.LOCATION_ENTRY_FIELD]: Field,
};

const App = () => {
  const sdk = useSDK();

  const Component = useMemo(() => {
    for (const [location, component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
  }, [sdk.location]);

  return Component ? (
    <AuthProvider>
      <ConfigDataProvider>
        <Suspense fallback={null}>
          <Component />
        </Suspense>
      </ConfigDataProvider>
    </AuthProvider>
  ) : null;
};

export default App;
