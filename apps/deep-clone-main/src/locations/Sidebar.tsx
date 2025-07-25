import { useEffect, useState } from 'react';
import { Text, Button, Stack } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import EntryCloner from '../utils/EntryCloner';
import { AppParameters } from '@/vite-env';

function Sidebar() {
  const REDIRECT_DELAY = 3000;
  const sdk = useSDK() as SidebarAppSDK;
  useAutoResizer();

  const [isLoading, setLoading] = useState<boolean>(false);
  const [isDisabled, setDisabled] = useState<boolean>(false);
  const [finished, setFinished] = useState<boolean>(false);
  const [referencesCount, setReferencesCount] = useState<number>(0);
  const [clonesCount, setClonesCount] = useState<number>(0);
  const [updatesCount, setUpdatesCount] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(0);
  const [freshParameters, setFreshParameters] = useState<AppParameters | null>(null);

  // Function to fetch fresh parameters directly from CMA
  const fetchFreshParameters = async (): Promise<AppParameters> => {
    try {
      if (!sdk.ids.organization || !sdk.ids.app || !sdk.ids.space) {
        throw new Error('Required SDK IDs not available');
      }
      
      const appInstallation = await sdk.cma.appInstallation.getForOrganization({
        appDefinitionId: sdk.ids.app,
        organizationId: sdk.ids.organization,
      });
      
      // Find the installation for this space
      const currentInstallation = appInstallation.items.find(
        (installation: any) => installation.sys.space?.sys.id === sdk.ids.space
      );
      
      if (currentInstallation?.parameters) {
        return currentInstallation.parameters as AppParameters;
      }
    } catch (error) {
      console.warn('Failed to fetch fresh parameters from CMA:', error);
    }
    
    // Fallback to SDK parameters
    return sdk.parameters.installation as AppParameters;
  };

  // Fetch fresh parameters on mount
  useEffect(() => {
    const loadFreshParameters = async () => {
      const params = await fetchFreshParameters();
      setFreshParameters(params);
    };

    // Always load fresh parameters on mount
    loadFreshParameters();
  }, []);

  useEffect(() => {
    if (countdown === 0) return;

    const interval = window.setInterval(() => {
      setCountdown((currentCountdown) => {
        if (currentCountdown <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return currentCountdown - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [countdown]);

  const clone = async (): Promise<void> => {
    setLoading(true);
    setDisabled(true);
    setFinished(false);
    setReferencesCount(0);
    setClonesCount(0);
    setUpdatesCount(0);

    // Fetch fresh parameters each time clone is called
    const parameters = await fetchFreshParameters();
    await sdk.entry.save();
    const cloner = new EntryCloner(sdk.cma, parameters);
    const { clonedEntry, referencesCount, clonesCount, updatesCount } = await cloner.cloneEntry(sdk.ids.entry);

    setReferencesCount(referencesCount);
    setClonesCount(clonesCount);
    setUpdatesCount(updatesCount);
    setLoading(false);
    setFinished(true);
    setCountdown(REDIRECT_DELAY / 1000);
    
    // Check redirect setting with fresh parameters
    if (parameters.automaticRedirect) {
      setTimeout(() => {
        sdk.navigator.openEntry(clonedEntry.sys.id);
      }, REDIRECT_DELAY);
    } else {
      setDisabled(false);
    }
    sdk.notifier.success('Clone successful');
  };

  const cloneMessage = () => {
    return `Found ${referencesCount} ${referencesCount > 1 ? 'references' : 'reference'}, created ${clonesCount} new ${
      clonesCount > 1 ? 'entries' : 'entry'
    }, updated ${updatesCount} ${updatesCount > 1 ? 'references' : 'reference'}`;
  };

  // Get fresh parameters for render logic
  const parameters = freshParameters || (sdk.parameters.installation as AppParameters);

  return (
    <Stack spacing="spacingM" flexDirection="column" alignItems="start">
      <Text fontColor="gray500" fontWeight="fontWeightMedium">
        Clone this entry and all referenced entries
      </Text>
      <Button variant="secondary" isLoading={isLoading} isDisabled={isDisabled} onClick={clone} isFullWidth>
        Clone entry
      </Button>
      {finished && (
        <Text fontColor="gray500" fontWeight="fontWeightMedium">
          {cloneMessage()}
        </Text>
      )}
      {finished && parameters.automaticRedirect && (
        <Text fontColor="gray500" fontWeight="fontWeightMedium">
          Redirecting to newly created clone in {countdown} seconds
        </Text>
      )}
    </Stack>
  );
}

export default Sidebar;
