import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useMemo } from 'react';
import { Config } from './locations/ConfigScreen';
import { PageRouter } from './locations/Page';
import { Field } from './locations/Field';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: Config,
  [locations.LOCATION_ENTRY_FIELD]: Field,
  [locations.LOCATION_PAGE]: PageRouter,
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

  return Component ? <Component /> : null;
};

export default App;
