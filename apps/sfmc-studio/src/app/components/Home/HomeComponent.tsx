'use client';
import React, { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import ConfigScreen from '../Locations/ConfigScreen';
import Page from '../Locations/Page';
import { useSDK } from '@contentful/react-apps-toolkit';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_PAGE]: Page,
};

const HomeComponent = () => {
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

export default HomeComponent;
