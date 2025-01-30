'use client';
import React, { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import ConfigScreen from 'src/app/components/Locations/ConfigScreen';
import Field from 'src/app/components/Locations/Field';
import EntryEditor from 'src/app/components/Locations/EntryEditor';
import Dialog from 'src/app/components/Locations/Dialog';
import Sidebar from 'src/app/components/Locations/Sidebar';
import Page from 'src/app/components/Locations/Page';
import Home from 'src/app/components/Locations/Home';
import { useSDK } from '@contentful/react-apps-toolkit';

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_FIELD]: Field,
  [locations.LOCATION_ENTRY_EDITOR]: EntryEditor,
  [locations.LOCATION_DIALOG]: Dialog,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
  [locations.LOCATION_PAGE]: Page,
  [locations.LOCATION_HOME]: Home,
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
