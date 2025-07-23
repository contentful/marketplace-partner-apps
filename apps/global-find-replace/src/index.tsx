import { createRoot } from 'react-dom/client';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import { PostHogProvider } from 'posthog-js/react';

import App from './App';
import LocalhostWarning from './components/LocalhostWarning';

const container = document.getElementById('root')!;
const root = createRoot(container);

if (import.meta.env.DEV && window.self === window.top) {
  // You can remove this if block before deploying your app
  root.render(<LocalhostWarning />);
} else {
  root.render(
    <PostHogProvider
      apiKey={'phc_O0FOKb2BVPp6zLB8UxxHYPrLYl0pe7Xfj3rzq5aTxOG'}
      options={{
        api_host: 'https://us.i.posthog.com',
        capture_exceptions: true,
        //debug: import.meta.env.MODE === 'development',
      }}>
      <SDKProvider>
        <GlobalStyles />
        <App />
      </SDKProvider>
    </PostHogProvider>,
  );
}
