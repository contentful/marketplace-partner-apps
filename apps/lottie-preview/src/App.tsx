import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useMemo } from 'react';
import Field from './locations/Field';
import ConfigScreen from './locations/ConfigScreen';

const ComponentLocationSettings = {
  [locations.LOCATION_ENTRY_FIELD]: Field,
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
};

const App = () => {
  const sdk = useSDK();

  const Component = useMemo(() => {
    for (const [location, component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
    return null;
  }, [sdk.location]);

  return Component ? <Component /> : null;
};

export default App;
