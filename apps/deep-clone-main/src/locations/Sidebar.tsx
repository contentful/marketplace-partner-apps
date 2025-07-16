import { useState } from 'react';
import { Stack, Button, Caption } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { cloneEntry, InstallationParams } from '../utils/clone';

function Sidebar() {
  const sdk = useSDK() as SidebarAppSDK;

  const installationParams: InstallationParams = {
    cloneText: 'Copy',
    cloneTextBefore: true,
    cloneAssets: false,
    automaticRedirect: true,
    msToRedirect: 5000,
    ...sdk.parameters.installation,
  };

  if (typeof installationParams.msToRedirect === 'string') {
    installationParams.msToRedirect = parseInt(installationParams.msToRedirect, 10);
  }

  const [isLoading, setLoading] = useState<boolean>(false);
  const [isDisabled, setDisabled] = useState<boolean>(false);

  // Initiate the clone process, show/hide loading, disable/enable button
  const clone = async (): Promise<void> => {
    setLoading(true);
    setDisabled(true);
    const clonedEntry = await cloneEntry(sdk.ids.entry, installationParams, sdk.cma);

    setLoading(false);

    if (installationParams.automaticRedirect === true) {
      setTimeout(() => {
        sdk.navigator.openEntry(clonedEntry.sys.id);
        setDisabled(false);
      }, installationParams.msToRedirect);
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
          ? `Redirecting to newly created clone in ${Math.round(installationParams.msToRedirect / 1000)} seconds.`
          : 'This clones the entry and all referenced entries'}
      </Caption>
    </Stack>
  );
}

export default Sidebar;
