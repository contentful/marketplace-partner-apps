import { createRoot } from 'react-dom/client';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import App from './App';
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://eb2c2e50708a174f47878d692f6b8415@o4509956505403392.ingest.us.sentry.io/4509956523098112',
  enableLogs: true,
  integrations: [
    Sentry.browserTracingIntegration({
      // Disable automatic instrumentation
      instrumentNavigation: false,
      traceXHR: false,
      traceFetch: false,
      instrumentPageLoad: false,
    }),
  ],
  tracesSampleRate: 1.0,
});

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
  <SDKProvider>
    <GlobalStyles />
    <App />
  </SDKProvider>,
);
