import { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import ConfigScreen from './locations/ConfigScreen';
import Field from './locations/Field';
import { useSDK } from '@contentful/react-apps-toolkit';

// This app only renders in two places: the installation config screen and
// the JSON field editor it takes over.
const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
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
    // No registered component for this location (noImplicitReturns wants the
    // fall-through spelled out); the caller renders nothing.
    return undefined;
  }, [sdk.location]);

  return Component ? <Component /> : null;
};

export default App;
