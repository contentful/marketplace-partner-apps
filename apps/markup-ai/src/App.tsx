import { Suspense, lazy, useMemo } from "react";
import { locations } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { AuthProvider } from "./contexts/AuthContext";

const DialogRouter = lazy(() => import("./locations/Dialog/DialogRouter"));
const ConfigScreen = lazy(() => import("./locations/ConfigScreen/ConfigScreen"));
const Field = lazy(() => import("./locations/Field/Field"));

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
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
      <Suspense fallback={null}>
        <Component />
      </Suspense>
    </AuthProvider>
  ) : null;
};

export default App;
