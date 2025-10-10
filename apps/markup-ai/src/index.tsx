import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import { QueryClientProvider } from '@tanstack/react-query';

import { createRoot } from 'react-dom/client';
import App from './App';
import LocalhostWarning from './components/LocalhostWarning/LocalhostWarning';
import { LocalizationProvider } from './contexts/LocalizationContext';
import { queryClient } from './hooks/useApiClient';
import './i18n'; // Initialize i18next

const container = document.getElementById('root')!;
const root = createRoot(container);

if (process.env.NODE_ENV === 'development' && globalThis.self === globalThis.top) {
  // You can remove this if block before deploying your app
  root.render(<LocalhostWarning />);
} else {
  root.render(
    <SDKProvider>
      <QueryClientProvider client={queryClient}>
        <GlobalStyles />
        <LocalizationProvider defaultLocale="en">
          <App />
        </LocalizationProvider>
      </QueryClientProvider>
    </SDKProvider>,
  );
}
