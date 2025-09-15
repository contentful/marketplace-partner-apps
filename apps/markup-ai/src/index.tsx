import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import { createRoot } from 'react-dom/client';
import App from './App';
import LocalhostWarning from './components/LocalhostWarning/LocalhostWarning';
import { LocalizationProvider } from './contexts/LocalizationContext';
import './i18n'; // Initialize i18next

const container = document.getElementById('root')!;
const root = createRoot(container);

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  // You can remove this if block before deploying your app
  root.render(<LocalhostWarning />);
} else {
  root.render(
    <SDKProvider>
      <GlobalStyles />
      <LocalizationProvider defaultLocale="en">
        <App />
      </LocalizationProvider>
    </SDKProvider>,
  );
}
