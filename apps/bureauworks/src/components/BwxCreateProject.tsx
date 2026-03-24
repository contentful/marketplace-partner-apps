import { useState, useEffect } from 'react';

import { ConfigAppSDK, SidebarAppSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';

import { Button, Note, Select, Spinner, Flex, Text } from '@contentful/f36-components';
import { Form, TextInput, FormControl } from '@contentful/f36-forms';
import { CloudUploadIcon } from '@contentful/f36-icons';

import BwxMultiselectWorkflows from '../components/BwxMultiselectWorkflows';
import BwxMultiselectLocales from '../components/BwxMultiselectLocales';
import BwxMultiselectReferences from './BwxMultiselectReferences';

import { ConfigGroup, ProjectCreation } from '../interfaces';

import bwxApi from '../api/api';

interface Props {
  onCreate: () => void;
  withName?: boolean;
  bulk?: boolean;
  entryIds?: string[];
  referenceIds?: string[];
}

function SendEntriesToBWX({ onCreate, withName, bulk, entryIds, referenceIds } : Props) {
  const sdkConfig = useSDK<ConfigAppSDK>();
  const sdkSideBar = useSDK<SidebarAppSDK>();
  const cma = useCMA();

  const [isAuth, setIsAuth] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingConfigs, setLoadingConfigs] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const [workflows, setWorkflows] = useState<string[]>(sdkConfig.parameters.installation.workflows ?? []);
  const [locales, setLocales] = useState<string[]>([]);
  const [localesState, setLocalesState] = useState<string[]>([]);
  const [configs, setConfigs] = useState<ConfigGroup[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [references, setReferences] = useState<string[]>([]);

  let projectRequest: any = null;

  useEffect(() => {
    const fetchEntryTitle = async () => {
      if (bulk) {
        try {
          const entryId = sdkSideBar.ids.entry; 

          const entry = await cma.entry.get({
            spaceId: sdkSideBar.ids.space,
            environmentId: sdkSideBar.ids.environment,
            entryId: entryId,
          });
  
          const contentTypeId = entry.sys.contentType.sys.id;
          const contentType = await cma.contentType.get({
            spaceId: sdkSideBar.ids.space,
            environmentId: sdkSideBar.ids.environment,
            contentTypeId: contentTypeId,
          });

          const displayField = contentType.displayField;
          const entryTitle = entry.fields[displayField]?.[sdkSideBar.locales.default] || "Untitled Project";

          setProjectName(entryTitle); 
        } catch (error) {
          console.error(error);
        }
      }
    };
  
    if (!projectName) {
      fetchEntryTitle();
    }
  }, [bulk, projectName, cma, sdkSideBar]);  

  const send = async () => {
    setLoading(true);
    setError(false);
    projectRequest = null;
    try {
      const params: ProjectCreation = {
        configGroupUuid: selectedConfig,
        targetLocales: locales.map(l => l.replace("ar_ac", "ar")),
        displayTitle: projectName,
        workflows: workflows
      }
      const combinedEntryIds = Array.from(
        new Set([...(entryIds?.length ? entryIds : [sdkSideBar.ids.entry]), ...(referenceIds || []), ...references,])
      );

      const response = bulk
        ? await bwxApi.sendEntries(params, combinedEntryIds, sdkConfig, cma)
        : await bwxApi.sendEntry(params, sdkSideBar.ids.entry, sdkConfig, cma);
      projectRequest = await response.json();
      poll(params);
    } catch (err) {
      setIsAuth(false);
    }
  }

  const poll = async (params: any) => {
    const runningStatuses = ['NEW', 'RUNNING'];
    while (projectRequest && runningStatuses.includes(projectRequest.status)) {
        try {
            const response = bulk ? await bwxApi.sendEntries(params, entryIds || [], sdkConfig, cma, projectRequest.id)
                                  : await bwxApi.sendEntry(params, sdkSideBar.ids.entry, sdkConfig, cma, projectRequest.id);
            projectRequest = await response.json();
        } catch (error) {
            console.error("Error polling: ", error);
            projectRequest.status = 'ERROR';
            setError(true);
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (projectRequest && projectRequest.status === 'ERROR') {
      setError(true);
    }

    setLoading(false);
    onCreate();
  }

  useEffect(() => {
    const loadConfigs = async () => {
      setLoadingConfigs(true);
      setError(false);
      try {
        const response = await bwxApi.getConfigs(sdkConfig, cma);
        const projectConfigs: any = await response.json();
    
        const configGroups: ConfigGroup[] = projectConfigs.map((config: { name: any; uuid: any; targetLocales: any }) => {
          const locs = config.targetLocales ? config.targetLocales.filter((l: string) => l !== '') : [];
          return {
            name: config.name,
            uuid: config.uuid,
            locales: locs.map((l: string) => l.replace("ar", "ar_ac")) //TODO move to mapping config
          }
        });
        
        setConfigs(configGroups);
        
        if (configGroups.length) {
          setSelectedConfig(configGroups[0].uuid);
          setLocales(configGroups[0].locales);
          setLocalesState(configGroups[0].locales);
        }
  
      } catch (error) {
        console.error(error);
        setError(true);
      } finally {
        setLoadingConfigs(false);
      }
    }

    loadConfigs()
  }, [sdkConfig, cma, setConfigs, setLocales, setLoadingConfigs, setSelectedConfig]);

  const onSelectConfig = (event: any) => {
    const configUuid = event.target.value;
    setSelectedConfig(configUuid);

    const config = configs.find(c => c.uuid === configUuid);
    if (config) {
      setLocales(config.locales);
      setLocalesState(config.locales);
    }
  }

  return (
    <>
      {loadingConfigs && (
        <Flex>
          <Text fontColor="blue500" marginRight="spacingXs" fontWeight="fontWeightDemiBold">Loading configs</Text>
          <Spinner variant="primary" />
        </Flex>
      )}

      {!loadingConfigs && (
        <Form style={{paddingLeft: "1px", paddingRight: "1px"}}>
          <FormControl.Label isRequired>Project Config</FormControl.Label>
          
          <Select id="configsSelect" name="configsSelect" value={selectedConfig} style={{marginBottom: "10px"}} onChange={onSelectConfig}>
            {configs.map((c: any) => {
              return (
                <Select.Option key={c.uuid} value={c.uuid}>{c.name}</Select.Option>
              );
            })}
          </Select>

          {sdkSideBar.location.is('entry-sidebar') && (
            <BwxMultiselectReferences
              entryId={sdkSideBar.ids.entry}
              selectedReferences={references}
              onInput={setReferences}
            />
          )}
                  
          <BwxMultiselectWorkflows onInput={setWorkflows} workflowsValue={workflows} hideTip={true}  />
          
          <div style={{marginTop: "10px"}} >
            <BwxMultiselectLocales onInput={setLocales} localesValue={locales} initialLocales={localesState} hideTip={true} />
          </div>

          {withName && (
          <FormControl isRequired isInvalid={!projectName}>
            <FormControl.Label>Project Name</FormControl.Label>
            <TextInput
              value={projectName}
              type="text"
              name="text"
              onChange={(e) => setProjectName(e.target.value)}
            />
            <FormControl.HelpText>Provide your Project Name</FormControl.HelpText>
            {!projectName && (
              <FormControl.ValidationMessage>
                Please, provide your Project Name.
              </FormControl.ValidationMessage>
            )}
          </FormControl>)}

          <Note style={{ marginBottom: "10px" }} variant="primary">
            If an entry has references, all its references are selected by default. 
            To deselect them, use the option under "References" and manage them individually.
          </Note>

          <Button 
            variant="positive"
            size="small"
            startIcon={<CloudUploadIcon />}
            isFullWidth
            onClick={send}
            isLoading={loading} 
            isDisabled={loading || !selectedConfig || (!locales || locales.length === 0)|| (!workflows || workflows.length === 0) || (withName && !projectName)}
          >
              Send to wxrks
          </Button>

          {configs.length === 0 && (
            <Note style={{marginTop: "10px"}} variant="warning">No project configurations found. Please check your wxrks account.</Note>
          )}
        </Form>
      )}

      {!isAuth && (
        <div>
          <br></br>
          <Note variant="negative">
            Authentication failed with wxrks. Please verify your credentials and reinstall the app with the correct credentials.
          </Note>
        </div>)
      }

      {error && (
        <div>
          <br></br>
          <Note variant="negative">
            Failed to create project on wxrks. Please try again later.
          </Note>
        </div>)
      }
    </>
  );
}

export default SendEntriesToBWX;

