import '@orangelogic-private/design-system/components/button';
import '@orangelogic-private/design-system/components/button-group';
import '@orangelogic-private/design-system/components/card';
import '@orangelogic-private/design-system/components/icon';
import '@orangelogic-private/design-system/components/icon-button';
import '@orangelogic-private/design-system/components/image';
import '@orangelogic-private/design-system/components/progress-bar';
import '@orangelogic-private/design-system/components/skeleton';
import '@orangelogic-private/design-system/components/tooltip';

import '@orangelogic-private/design-system/react-types';

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
