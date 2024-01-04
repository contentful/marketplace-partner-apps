import { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

import Page from './locations/Page';

const ComponentLocationSettings = {
  [locations.LOCATION_HOME]: Page,
  [locations.LOCATION_PAGE]: Page,
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

  return Component ? <Component /> : null;
};

export default App;
