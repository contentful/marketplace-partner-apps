import React from 'react';
import { createRoot } from 'react-dom/client';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import App from './App';

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <SDKProvider>
      <GlobalStyles />
      <App />
    </SDKProvider>
  </React.StrictMode>
);
