import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useMemo } from 'react';
import Dialog from './locations/Dialog';
import Field from './locations/Field';
import Configuration from './locations/Configuration';
import { ImageKitProvider } from '@imagekit/react';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: Configuration,
  [locations.LOCATION_ENTRY_FIELD]: Field,
  [locations.LOCATION_DIALOG]: Dialog,
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

  return Component ? <ImageKitProvider urlEndpoint={''}><Component /></ImageKitProvider> : null;
};

export default App;
