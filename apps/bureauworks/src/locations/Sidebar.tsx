import { useState, useEffect, useCallback } from 'react';
import { SidebarAppSDK, ConfigAppSDK } from '@contentful/app-sdk';

import { Flex, Badge, Button, Note, Spinner, Collapse } from '@contentful/f36-components';
import { CycleIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from '@contentful/f36-icons';
import { Text } from '@contentful/f36-typography';
import { useSDK, useCMA } from '@contentful/react-apps-toolkit';

import BwxCreateProject from '../components/BwxCreateProject';
import BwxFetchTranslations from '../components/BwxFetchTranslations';
import TMUpdates from '../components/TMUpdates';

import bwxApi from '../api/api';

interface EntryProgress {
  language: string;
  progress: number;
}

interface ProjectStatus {
  status: string;
  entriesProgress?: EntryProgress[];
}

const Sidebar = () => {
  const sdkConfig = useSDK<ConfigAppSDK>();
  const sdk = useSDK<SidebarAppSDK>();
  const cma = useCMA();

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk]);

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingApp, setLoadingApp] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | null>(null);

  const getProgress = useCallback(async () => {
    setLoading(true);
    setError(false);
    setIsExpanded(false);
    try {
      const response = await bwxApi.getProgress(sdk.ids.entry, sdkConfig, cma);
      const status = await response.json();
      setProjectStatus(status);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [sdk, sdkConfig, cma]);

  const checkApp = useCallback(async () => {
    setLoadingApp(true);
    setError(false);
    try {
      await bwxApi.checkAuth(sdkConfig, cma);
      await getProgress();
    } catch (e) {
      console.error('Error while loading app', e);
      setError(true);
    } finally {
      setLoadingApp(false);
    }
  }, [getProgress, sdkConfig, cma]);

  useEffect(() => {
    checkApp();
  }, [checkApp]);

  const getLocale = (locale: string) => {
    if (locale === 'ar') {
      locale = 'ar_ac';
    }

    const loc = Object.entries(sdk.locales.names).find((locEntry) =>
      locale.replaceAll('_', '-').toLowerCase() === locEntry[0].toLowerCase()
    );
    return loc ? loc[1] : locale;
  };

  const getVariantStatus = (status: string) => {
    if (status === 'IN_PROGRESS') {
      return 'featured';
    }

    if (status === 'COMPLETED') {
      return 'positive';
    }

    return 'warning';
  };

  const getVariantProgress = (value: number) => {
    if (value < 1) {
      return 'primary';
    }

    if (value >= 1) {
      return 'positive';
    }

    return 'secondary';
  };

  return (
    <>
      {loadingApp && (
        <Flex>
          <Text marginRight="spacingXs" fontWeight="fontWeightDemiBold">Loading wxrks App</Text>
          <Spinner variant="primary" />
        </Flex>
      )}

      {!loadingApp && (
        <>
          <Button variant="primary" onClick={() => setIsExpanded(!isExpanded)} isFullWidth startIcon={<PlusIcon />} endIcon={!isExpanded ? <ChevronDownIcon /> : <ChevronUpIcon />}>
            Create project on wxrks
          </Button>

          <Collapse isExpanded={isExpanded}>
            <br></br>
            {isExpanded && <BwxCreateProject bulk onCreate={getProgress} />}
          </Collapse>

          <br></br>

          {projectStatus && (
            <Flex justifyContent="space-between" alignItems="center" style={{ width: '291px' }}>
              <Text><b>Translation Status</b></Text>
              <Button size="small" startIcon={<CycleIcon variant="muted" />} variant="transparent" onClick={getProgress} isLoading={loading} isDisabled={loading}></Button>
              <Badge variant={getVariantStatus(projectStatus.status)}><span style={{ textTransform: 'uppercase' }}>{projectStatus.status.replaceAll('_', ' ')}</span></Badge>
            </Flex>
          )}

          {projectStatus && projectStatus.status === 'NOT_FOUND' && (
            <div>
              <br></br>
              <Flex justifyContent="space-between" alignItems="center" style={{ width: '291px' }}>
                <br></br>
                <Note variant="neutral">
                  This entry has not been submitted to wxrks yet. Click the button when ready to create the project.
                </Note>
              </Flex>
            </div>
          )}

          {projectStatus && projectStatus.entriesProgress && projectStatus.entriesProgress.map((item) => (
            <Flex key={item.language} justifyContent="space-between" alignItems="center">
              <Text>{getLocale(item.language)}</Text>
              <Badge variant={getVariantProgress(item.progress)} size="small">{(item.progress * 100).toFixed(0)}%</Badge>
            </Flex>
          ))}

          {projectStatus && projectStatus.entriesProgress && projectStatus.status === 'IN_PROGRESS' && !projectStatus.entriesProgress.length && (
            <Note>
              The project's entry creation is still ongoing. Click the refresh button to see progress.
            </Note>
          )}

          {error && (
            <div>
              <Note variant="negative">
                Failed to load status in wxrks. Please try again later.
              </Note>
              <br></br>
              <Button variant="secondary" onClick={checkApp} isFullWidth>
                Try again
              </Button>
            </div>
          )}

          {projectStatus && projectStatus.status !== 'NOT_FOUND' && (
            <div>
              <br></br>
              <BwxFetchTranslations />
            </div>
          )}
        </>
      )}
      <TMUpdates />
    </>
  );
};

export default Sidebar;

