import React from 'react';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import ViewSelector from './ViewSelector';

const Main = () => {
  return (
    <SDKProvider>
      <ViewSelector />
    </SDKProvider>
  );
};

export default Main;
