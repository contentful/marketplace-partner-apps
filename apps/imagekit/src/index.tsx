import { createRoot } from 'react-dom/client';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import App from './App';

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
  <SDKProvider>
    <App />
  </SDKProvider>
);