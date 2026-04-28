import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import Sidebar from './locations/Sidebar';

// Wrapper component to check location and route accordingly
const AppRouter = () => {
  const sdk = useSDK();
  const [shouldLoadDamApp, setShouldLoadDamApp] = useState(false);

  useEffect(() => {
    // If not sidebar location, initialize dam-app-base
    if (!sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
      setShouldLoadDamApp(true);
      // Dynamically import to prevent setup() from running for sidebar
      import('./index.jsx');
    }
  }, [sdk.location]);

  // Render sidebar if in sidebar location
  if (sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
    return <Sidebar />;
  }

  // For other locations, dam-app-base will handle rendering
  // Return null and let dam-app-base render
  return null;
};

// Initialize the app
const root = document.getElementById('root');
if (root) {
  const reactRoot = createRoot(root);
  
  reactRoot.render(
    <StrictMode>
      <SDKProvider>
        <AppRouter />
      </SDKProvider>
    </StrictMode>
  );
}
