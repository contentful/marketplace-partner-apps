import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useMemo, React } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import ConfigScreen from './locations/ConfigScreen';
import Sidebar from './locations/Sidebar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 20,
      cacheTime: 0,
    },
  },
});

const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  [locations.LOCATION_ENTRY_SIDEBAR]: Sidebar,
};

function App() {
  const sdk = useSDK();
  const Component = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const [location, component] = Object.entries(
      ComponentLocationSettings,
    ).find(([key]) => sdk.location.is(key)) || [null, null];

    return component;
  }, [sdk.location]);

  return (
    <QueryClientProvider client={queryClient}>
      {Component ? <Component /> : null}
    </QueryClientProvider>
  );
}

export default App;
