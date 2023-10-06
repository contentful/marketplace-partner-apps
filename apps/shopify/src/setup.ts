import { DialogAppSDK, init, locations } from '@contentful/app-sdk';
import { GlobalStyles } from '@contentful/f36-components';
import * as React from 'react';
import { render } from 'react-dom';
import { Field } from './Editor/Field';
import { IntegrationProvider } from '@contentful/ecommerce-app-base/lib/Editor/IntegrationContext';
import { Integration, Product } from '@contentful/ecommerce-app-base/lib/types';
import { SDKProvider } from '@contentful/react-apps-toolkit';

export function setup<P extends Product = Product>(integration: Integration<P>) {
  init((sdk) => {
    const root = document.getElementById('root');

    if (sdk.location.is(locations.LOCATION_DIALOG)) {
      integration.renderDialog(sdk as DialogAppSDK);
    }

    if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
      render(
        <IntegrationProvider integration={integration}>
          <SDKProvider>
            <GlobalStyles />
            <Field />
          </SDKProvider>
        </IntegrationProvider>
      );
    }
  });
}
