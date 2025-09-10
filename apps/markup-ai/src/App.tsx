import { Suspense, lazy, useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
const Sidebar = lazy(() => import('./locations/Sidebar/Sidebar'));
const DialogRouter = lazy(() => import('./locations/Dialog/DialogRouter'));
const ConfigScreen = lazy(() => import('./locations/ConfigScreen/ConfigScreen'));

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
  [locations.LOCATION_DIALOG]: DialogRouter,
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
    <Suspense fallback={null}>
      <Component />
    </Suspense>
  ) : null;
};

export default App;
