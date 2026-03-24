import { useEffect, useState } from 'react';

import { ConfigAppSDK, SidebarAppSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';

import { Button, Notification, Collapse, Checkbox, Flex, Note, Tooltip, TextLink } from '@contentful/f36-components';
import { DownloadIcon, ChevronDownIcon, ChevronUpIcon } from '@contentful/f36-icons';

import bwxApi from '../api/api';

interface Project {
  projectUuid: string;
  status: string;
  requestId?: string;
}

interface Props {
  project?: any;
}

const ERROR_MESSAGE = 'Failed to fetch translations from Bureau Works. Please try again later.';
const ERROR_AUTH_MESSAGE = 'Authentication failed with Bureau Works. Please check app credentials in App Configuration and try again.';

function BwxFetchTranslations({ project } : Props) {
  const sdkConfig = useSDK<ConfigAppSDK>();
  const sdkSideBar = useSDK<SidebarAppSDK>();
  const cma = useCMA();

  const [isAuth, setIsAuth] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const [force, setForceTranslations] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  let projectRequest: any = null;

  const mapToObject = (map: Map<string, Project>): { [key: string]: Project } => {
    return Object.fromEntries(map);
  };
  
  const objectToMap = (obj: { [key: string]: Project }): Map<string, Project> => {
    return new Map(Object.entries(obj) as [string, Project][]);
  };
  
  const getStoredProjects = (): Map<string, Project> => {
    const storedProjects = localStorage.getItem('bwx-translations-projects');
    return storedProjects ? objectToMap(JSON.parse(storedProjects)) : new Map();
  };
  
  const saveProjectToStorage = (projectData: Project) => {
    const storedProjects = getStoredProjects();
    storedProjects.set(projectData.projectUuid, projectData);
    localStorage.setItem('bwx-translations-projects', JSON.stringify(mapToObject(storedProjects)));
  };

  useEffect(() => {
    const storedProjects = getStoredProjects();
    const storedProject = storedProjects.get(project?.uuid);
    if (storedProject) {
      if (storedProject.status === 'RUNNING' && storedProject.requestId) {
        setLoading(true);
        projectRequest = { id: storedProject.requestId, status: 'RUNNING' };
        poll();
      } else {
        setLoading(false);
      }
    }
  }, [project?.uuid])
 
  const fetch = async () => {
    setIsAuth(true);
    setLoading(true);
    setError(false);
    setCompleted(false);
    projectRequest = null;
    try {
      const response = await bwxApi.fetchTranslations(force, sdkSideBar.ids.entry, project?.uuid, sdkConfig, cma);
      projectRequest = await response.json();
      saveProjectToStorage({ projectUuid: project?.uuid, status: 'RUNNING', requestId: projectRequest.id });
      poll();
    } catch (err) {
      setIsAuth(false);
      setLoading(false);
      showErrorNotification(ERROR_AUTH_MESSAGE);
    }
  }

  const poll = async () => {
    const runningStatuses = ['NEW', 'RUNNING'];
    setLoading(true);

    while (projectRequest && runningStatuses.includes(projectRequest.status)) {
        try {
          const response = await bwxApi.fetchTranslations(force, sdkSideBar.ids.entry, project?.uuid, sdkConfig, cma, projectRequest.id);
          projectRequest = await response.json();
          saveProjectToStorage({ projectUuid: project?.uuid, status: projectRequest.status, requestId: projectRequest.id });
        } catch (error) {
            console.error("Error polling: ", error);
            projectRequest.status = 'ERROR';
            setError(true);
            showErrorNotification(ERROR_MESSAGE);
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (projectRequest && projectRequest.status === 'ERROR') {
      setLoading(false);
      setError(true);
      const msg = projectRequest.error ? projectRequest.error.replace("BW Error:", "").trim() : '';
      setErrorMessage(msg);
      showErrorNotification(msg || ERROR_MESSAGE);
    } else if (projectRequest && projectRequest.status === 'DONE') {
      setLoading(false);
      setCompleted(true);
      if (project) {
        Notification.setPlacement('top');
        Notification.success('Translations successfully retrieved from Bureau Works.', { duration: 0 });
      }
      saveProjectToStorage({ projectUuid: project?.uuid, status: 'DONE' });
    }

    setLoading(false);
  }

  const close = () => {
    setCompleted(false);
  }

  const showErrorNotification = (msg: string) => {
    if (project) {
      Notification.setPlacement('top');
      Notification.error(msg, { duration: 0 });
    }
  }

  return (
    <>
      <Button variant="primary" 
              startIcon={<DownloadIcon />} 
              isFullWidth
              size={project ? 'small' : 'medium' }
              onClick={fetch} 
              isLoading={loading} 
              isDisabled={loading}
      >
        {loading ? "Fetching translations..." : "Fetch translations"}
      </Button>

      <Flex justifyContent="end" alignItems="end">
        <TextLink onClick={() => setIsExpanded(!isExpanded)} icon={!isExpanded ? <ChevronDownIcon /> : <ChevronUpIcon />} alignIcon="end">
          More options
        </TextLink>
      </Flex>

      <Collapse isExpanded={isExpanded}>
        <Tooltip placement="top-end" 
                 showDelay={1000} 
                 id="tooltip-force-translations" 
                 content="This option disregards the current status of the project on Bureau Works and pulls the current state of translations."
        >
          <Checkbox
            name="force-translations"
            id="force-translations"
            isChecked={force}
            onChange={() => setForceTranslations(!force)}
          >
            Force download of Bureau Works translations
          </Checkbox>
        </Tooltip>
      </Collapse>

      {completed && !project &&
        <div>
          <br></br>
          <Note variant="positive" withCloseButton onClose={close}>
            Translations successfully retrieved from Bureau Works.
          </Note>
        </div>  
      }
      {!isAuth && !project && (
        <div>
          <br></br>
          <Note variant="negative">
            {ERROR_AUTH_MESSAGE}
          </Note>
        </div>)
      }
      {error && !project && (
        <div>
          <br></br>
          <Note variant={errorMessage ? 'warning' : 'negative'} withCloseButton onClose={close}>
            {errorMessage || ERROR_MESSAGE}
          </Note>
        </div>)
      }
    </>
  );
}

export default BwxFetchTranslations;
