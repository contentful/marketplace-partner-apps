import { useState } from 'react';
import { Stack, Button, Caption } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import EntryCloner from '../utils/EntryCloner';
import { AppParameters } from '@/vite-env';

function Sidebar() {
  const sdk = useSDK() as SidebarAppSDK;

  const installationParams: AppParameters = {
    cloneText: 'Copy',
    cloneTextBefore: true,
    automaticRedirect: true,
    ...sdk.parameters.installation,
  };

  const [isLoading, setLoading] = useState<boolean>(false);
  const [isDisabled, setDisabled] = useState<boolean>(false);

  // Initiate the clone process, show/hide loading, disable/enable button
  const clone = async (): Promise<void> => {
    setLoading(true);
    setDisabled(true);
    await sdk.entry.save();
    const cloner = new EntryCloner(sdk.cma, installationParams);
    const clonedEntry = await cloner.cloneEntry(sdk.ids.entry);

    setLoading(false);

    if (installationParams.automaticRedirect === true) {
      setTimeout(() => {
        sdk.navigator.openEntry(clonedEntry.sys.id);
        setDisabled(false);
      }, 5000);
    } else {
      setDisabled(false);
    }
  };

  return (
    <Stack alignItems="start" flexDirection="column" spacing="spacingS">
      <Button variant="primary" isLoading={isLoading} isDisabled={isDisabled} onClick={clone}>
        Clone
      </Button>
      <Caption id="caption">
        {isLoading
          ? `Cloning: Found 0 references, created 0 new entries, updated 0 references`
          : isDisabled && installationParams.automaticRedirect
          ? `Redirecting to newly created clone in ${Math.round(5000 / 1000)} seconds.`
          : 'This clones the entry and all referenced entries'}
      </Caption>
    </Stack>
  );
}

export default Sidebar;
