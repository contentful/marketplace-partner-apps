import React, { useMemo } from 'react';
import { locations } from '@contentful/app-sdk';
import EntryEditor from './locations/EntryEditor';

import { useSDK } from '@contentful/react-apps-toolkit';


/**
 * A mapping of component location settings.
 * @typedef {Object} ComponentLocationSettings
 * @property {string} - The location of the component.
 * @property {React.Component} - The React component to be rendered for the given location.
 */
const ComponentLocationSettings = {
  [locations.LOCATION_ENTRY_EDITOR]: EntryEditor,
 };

 /**
 * The main application component.
 * @returns {React.Element} - The React element to be rendered.
 */
const App = () => {
  const sdk = useSDK();

   /**
   * Get the component based on the current SDK location.
   * @returns {React.Component|null} - The React component or null if no component found.
   */
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
