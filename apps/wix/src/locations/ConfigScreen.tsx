import React, { useCallback, useEffect, useState } from 'react';

import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Heading,
  Button,
  Paragraph,
  Note,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { PlainClientAPI } from 'contentful-management/dist/typings/plain/common-types';
import { ConnectedSitesList } from '../components/ConnectedSitesList';
import { ConnectionState, getWixInstallUrl } from '../services/wix-app.srv';

export enum TestIds {
  TITLE = 'wix-config-title',
  CONNECT_ACCOUNT = 'wix-connect-account',
  CONNECTED_SITES_LIST = 'wix-connected-sites-list',
  NOT_INSTALLED_STATE = 'wix-not-installed-state',
}

export const Config = () => {
  const [childWindow, setChildWindow] = useState<Window | null>(null);
  const sdk = useSDK<ConfigAppSDK>();
  const cma = sdk.cma as PlainClientAPI;
  const {
    environment: environmentId,
    space: spaceId,
    app: contentfulAppId,
  } = sdk.ids;
  const [isInstalled, setIsInstalled] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState | null>(null);
  const [handledEvents, setHandledEvents] = useState(0);

  useEffect(() => {
    Promise.all([
      cma.space.get({ spaceId }),
      cma.environment.get({ spaceId, environmentId }),
      cma.locale.getMany({ spaceId, environmentId }),
      sdk.app.isInstalled(),
    ]).then(([spaceRes, envRes, localesRes, isInstalledRes]) => {
      setConnectionState({
        contentfulAppId,
        environment: { label: envRes.name, id: environmentId },
        space: { label: spaceRes.name, id: spaceId },
        locales: localesRes.items.map((locale) => ({
          id: locale.code,
          label: locale.name,
          isDefault: locale.default,
        })),
      });
      setIsInstalled(isInstalledRes);
      void sdk.app.setReady();
    });
  }, []);

  useEffect(() => {
    const handleChildEvents = (event: any) => {
      if (event.source === childWindow) {
        // post installed from wix
        if (event.data.connected) {
          setHandledEvents(handledEvents + 1);
        }
      }
    };

    window.addEventListener('message', handleChildEvents);

    return () => {
      window.removeEventListener('message', handleChildEvents);
    };
  }, [childWindow]);

  const openWixInstallWindow = useCallback(() => {
    const url = getWixInstallUrl(connectionState!);
    const child = window.open(url, '_blank');
    setChildWindow(child);
  }, [connectionState]);

  sdk.app.onConfigurationCompleted(() => {
    sdk.app.isInstalled().then(setIsInstalled);
  });

  return (
    <Box marginTop="spacingXl">
      <Heading testId={TestIds.TITLE}>Connect Wix</Heading>
      <Paragraph>
        Connect your Wix account so you can access your Contentful models from a
        Wix site and link them to elements on your site.
      </Paragraph>
      {isInstalled ? (
        <>
          <Box>
            <Button
              testId={TestIds.CONNECT_ACCOUNT}
              onClick={openWixInstallWindow}
              variant="primary"
            >
              Connect account
            </Button>
          </Box>
          <Box paddingTop="spacingXl">
            <ConnectedSitesList
              testId={TestIds.CONNECTED_SITES_LIST}
              updatesModifier={handledEvents}
              environmentId={environmentId}
              contentfulAppId={contentfulAppId}
              spaceId={spaceId}
            />
          </Box>
        </>
      ) : (
        <Note variant="warning" testId={TestIds.NOT_INSTALLED_STATE}>
          You will only be able to connect your models to Wix after you install
          the app, please click "Install" first.
        </Note>
      )}
    </Box>
  );
};
