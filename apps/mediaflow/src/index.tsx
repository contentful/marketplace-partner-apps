import { createRoot } from 'react-dom/client';

import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import LocalhostWarning from './components/LocalhostWarning';
import App from './App';

const container = document.getElementById('root');
if(!container) {
  throw new Error("The #root element is missing from index.html");
}
const root = createRoot(container);

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
  root.render(<LocalhostWarning />);
} else {
  root.render(
    <SDKProvider>
      <GlobalStyles />
      <App />
    </SDKProvider>
  );
}
