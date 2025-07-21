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

  const parameters = sdk.parameters.installation as AppParameters;

  const [isLoading, setLoading] = useState<boolean>(false);
  const [isDisabled, setDisabled] = useState<boolean>(false);
  const [finished, setFinished] = useState<boolean>(false);
  const [referencesCount, setReferencesCount] = useState<number>(0);
  const [clonesCount, setClonesCount] = useState<number>(0);
  const [updatesCount, setUpdatesCount] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(REDIRECT_DELAY / 1000);

  useEffect(() => {
    if (finished && parameters.redirect) {
      const interval = setInterval(() => {
        if (countdown > 0) {
          setCountdown((currentCountdown) => currentCountdown - 1);
        } else {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [finished]);

  const clone = async (): Promise<void> => {
    setLoading(true);
    setDisabled(true);
    setFinished(false);
    setReferencesCount(0);
    setClonesCount(0);
    setUpdatesCount(0);

    await sdk.entry.save();
    const cloner = new EntryCloner(sdk.cma, parameters);
    const { clonedEntry, referencesCount, clonesCount, updatesCount } = await cloner.cloneEntry(sdk.ids.entry);

    setReferencesCount(referencesCount);
    setClonesCount(clonesCount);
    setUpdatesCount(updatesCount);
    setLoading(false);
    setFinished(true);
    if (parameters.redirect) {
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
      {finished && parameters.redirect && (
        <Text fontColor="gray500" fontWeight="fontWeightMedium">
          Redirecting to newly created clone in {countdown} seconds.
        </Text>
      )}
    </Stack>
  );
}

export default Sidebar;
