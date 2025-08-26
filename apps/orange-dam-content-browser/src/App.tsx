import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useMemo } from 'react';
import Dialog from './locations/Dialog';
import Field from './locations/Field';
import { useDesignSystem } from './utils/hooks';

const ComponentLocationSettings = {
  [locations.LOCATION_DIALOG]: Dialog,
  [locations.LOCATION_ENTRY_FIELD]: Field,
};

const App = () => {
  const sdk = useSDK();
  useDesignSystem();

  const Component = useMemo(() => {
    for (const [location, component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
  }, [sdk.location]);

  return Component ? <div data-testid="app-container"><Component /></div> : null;
};

export default App;
