import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';

import { createRoot } from 'react-dom/client';
import App from './App';
import LocalhostWarning from './components/LocalhostWarning';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import { ThemeProvider } from '@mui/material';
import theme from '@/components/ui/theme';

const container = document.getElementById('root')!;
const root = createRoot(container);

const queryClient = new QueryClient();

if (process.env.NODE_ENV === 'development' && window.self === window.top) {
    // You can remove this if block before deploying your app
    root.render(<LocalhostWarning />);
} else {
    root.render(
      <SDKProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <GlobalStyles />
            <App />
          </ThemeProvider>
        </QueryClientProvider>
      </SDKProvider>
    );
}
