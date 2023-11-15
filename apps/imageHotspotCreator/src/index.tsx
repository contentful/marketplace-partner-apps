/**
 * Importing necessary modules
 * @module App
 */

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import { createRoot } from 'react-dom/client';
import App from './App';
import LocalhostWarning from './components/LocalhostWarning';

/**
 * Getting the root container element
 * @constant {HTMLDivElement} container - The root container element
 */
const container = document.getElementById('root')!;

/**
 * Creating the root element for React rendering
 * @constant {ReactRoot} root - The root element
 */
const root = createRoot(container);

/**
 * Checking if the app is running in development mode and not in an iframe
 * If true, render the LocalhostWarning component
 * If false, render the SDKProvider, GlobalStyles, and App components
 */
if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  // You can remove this if block before deploying your app
  root.render(<LocalhostWarning />);
} else {
  root.render(
    <SDKProvider>
      <GlobalStyles />
      <App />
    </SDKProvider>
  );
}