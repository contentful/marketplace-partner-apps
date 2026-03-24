import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';

import { Tabs, Flex, Box } from '@contentful/f36-components';
import { FolderCreateIcon, FolderIcon } from '@contentful/f36-icons';

import { useSDK } from '@contentful/react-apps-toolkit';
import packageJson from '../../../package.json';

interface InvocationParams {
  path?: string;
}

export const PageLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const sdk = useSDK();

  const currentTab = useRef('/');

  // check if the page already opened with an existing path from the invocation parameters
  useEffect(() => {
    const initialInvocationParameters = sdk.parameters.invocation as InvocationParams;
    if (
      initialInvocationParameters.path &&
      initialInvocationParameters.path !== currentTab.current
    ) {
      navigate(initialInvocationParameters.path);
      currentTab.current = initialInvocationParameters.path;
    }
  }, [sdk.parameters.invocation]);

  const onTabChange = (tabId: string) => {
    sdk.navigator.openCurrentAppPage({ path: tabId });
    currentTab.current = tabId;
    navigate(tabId);
  };

  return (
    <div>
      <Tabs currentTab={location.pathname} onTabChange={onTabChange}>
        <Tabs.List variant="horizontal-divider">
          <Tabs.Tab panelId="/content">
            <Flex alignItems="center">
              <Flex marginRight="spacingS">
                <FolderCreateIcon />
              </Flex>
              Create Project
            </Flex>
          </Tabs.Tab>
          <Tabs.Tab panelId="/projects">
            <Flex alignItems="center">
              <Flex marginRight="spacingS">
                <FolderIcon />
              </Flex>
              List Projects
            </Flex>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>
      <Outlet />
      <Box marginTop="spacingXl" style={{ textAlign: 'center', color: '#666', fontSize: '12px', paddingTop: '20px', paddingBottom: '20px' }}>
        wxrks - v{packageJson.version}
      </Box>
    </div>
  );
};

