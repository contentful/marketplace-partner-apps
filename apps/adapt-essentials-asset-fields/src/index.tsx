import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SDKProvider>
      <GlobalStyles />
      <App />
    </SDKProvider>
  </React.StrictMode>,
)
