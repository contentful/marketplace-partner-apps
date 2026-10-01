import { useSDK } from '@contentful/react-apps-toolkit';
import { locations } from '@contentful/app-sdk';
import ConfigScreen from './locations/ConfigScreen';

// The config screen is the only UI. Tagging itself runs in the autoTagByRole function, called by a
// Contentful Automation on entry creation.
export default function App() {
  const sdk = useSDK();

  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    return <ConfigScreen />;
  }

  return null;
}
