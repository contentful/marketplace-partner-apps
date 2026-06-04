import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';

import { Tabs, Flex, Box } from '@contentful/f36-components';
import { FolderCreateIcon, FolderIcon } from '@contentful/f36-icons';

import { useSDK } from '@contentful/react-apps-toolkit';
import packageJson from '../../../package.json';

interface InvocationParams {
  path?: string;
}

const TAB_PATHS = ['/content', '/projects'];
const DEFAULT_TAB_PATH = '/content';

const getTabPath = (path?: string) => {
  return path && TAB_PATHS.includes(path) ? path : DEFAULT_TAB_PATH;
};

export const PageLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const sdk = useSDK();

  const lastInvocationPath = useRef<string>();

  useEffect(() => {
    const invocationParameters = sdk.parameters.invocation as InvocationParams;
    const invocationPath = getTabPath(invocationParameters.path);

    if (invocationPath === lastInvocationPath.current) {
      return;
    }

    lastInvocationPath.current = invocationPath;

    if (invocationPath !== location.pathname) {
      navigate(invocationPath, { replace: true });
    }
  }, [sdk.parameters.invocation, location.pathname, navigate]);

  const onTabChange = (tabId: string) => {
    const tabPath = getTabPath(tabId);

    if (tabPath !== location.pathname) {
      navigate(tabPath);
    }

    sdk.navigator.openCurrentAppPage({ path: tabPath });
  };

  return (
    <div>
      <Tabs currentTab={getTabPath(location.pathname)} onTabChange={onTabChange}>
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
