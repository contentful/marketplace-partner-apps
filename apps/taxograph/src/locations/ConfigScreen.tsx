import { useEffect, useState, useCallback } from 'react';

import { ContentTypeProps } from 'contentful-management';

import { useSDK } from '@contentful/react-apps-toolkit';

import { ConfigAppSDK } from '@contentful/app-sdk';

import { SettingsIcon } from '@contentful/f36-icons';
import { Switch, Button, Tooltip } from '@contentful/f36-components';

import { getContentTypes, getContentSchemas } from '../api';

import { createCDAClient, buildTargetState, updateSelectedContentTypes } from '../helpers';

import { TaxonomyValidation } from '../components/TaxonomyValidation';
import { CDAKeyInput } from '../components/CDAKeyInput';
import { ConceptSchema } from '../types';

export interface AppInstallationParameters {
  cda_key: string
}

export const Config = () => {
  const sdk = useSDK<ConfigAppSDK>();

  const client = sdk.cma;

  const [parameters, setParameters] = useState<AppInstallationParameters | null>(null);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([]);
  const [schemas, setSchemas] = useState<ConceptSchema[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [showInputScreen, setShowInputScreen] = useState<boolean>(true);
  const [cdaClient, setCDAClient] = useState<any>(null);

  const onConfigure = useCallback(async () => {
    if (!parameters?.cda_key)
      throw new Error('Missing CDA Key');

    if (selectedContentTypes.length > 0) {
      try {
        await Promise.all(updateSelectedContentTypes({ client, sdk, selectedContentTypes, selectedSchemas, contentTypes }))
      } catch (error) {
        console.error(error);
        throw new Error('Apply taxonomy validation error')
      }
    }

    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: {
        EditorInterface: {
          ...currentState?.EditorInterface,
          ...buildTargetState(selectedContentTypes)
        }
      }
    };
  }, [client, parameters, sdk, selectedContentTypes, selectedSchemas]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);

        if (currentParameters.cda_key)
          setShowInputScreen(false);
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  useEffect(() => {
    if (parameters?.cda_key)
      setCDAClient(createCDAClient(sdk.ids.space, sdk.ids.environment, parameters.cda_key));
    else
      setCDAClient(null);
  }, [sdk, parameters])

  useEffect(() => {
    (async () => {
      if (cdaClient) {
        const contentTypeItems = await getContentTypes(client, sdk.ids.space, sdk.ids.environment);

        contentTypeItems.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setContentTypes(contentTypeItems);

        const schemaItems = await getContentSchemas(cdaClient);
        setSchemas(schemaItems);

        const currentState = await sdk.app.getCurrentState();

        if (currentState?.EditorInterface)
          setSelectedContentTypes(Object.keys(currentState?.EditorInterface));
      }
    })();
  }, [cdaClient]);

  const handleSwitchChange = (id: string) => {
    if (!isChecked(id)) {
      setSelectedContentTypes((prevState: any) => [...prevState, id]);
    } else {
      const newSelectedTypes = selectedContentTypes.filter(
        (item) => item !== id,
      );
      setSelectedContentTypes(newSelectedTypes);
    }
  }

  const isChecked = (id: string) => {
    return !!selectedContentTypes.find(item => item === id);
  }

  return (
    <>
      <div className='bg-gradient-to-r from-[#036fe3] to-[#2e91fb] pb-40 w-full'></div>
      <div className='flex flex-col p-8 max-w-7xl mx-auto -mt-32'>
        <div className='z-10 w-full bg-white p-8 shadow-md rounded-md relative'>
          <div className='absolute top-3 right-3'>
            <Tooltip content='Edit API key' placement='left' id='edit-api-key'>
              <Button
                variant='secondary'
                isActive={showInputScreen}
                onClick={() => setShowInputScreen(!showInputScreen)}>
                <SettingsIcon variant='secondary' />
              </Button>
            </Tooltip>
          </div>

          {!showInputScreen &&
            <TaxonomyValidation schemas={schemas} selectedSchemas={selectedSchemas} setSelectedSchemas={setSelectedSchemas} orgId={sdk.ids.organization} />
          }
          {showInputScreen &&
            <CDAKeyInput
              setParameters={setParameters}
              setShowInputScreen={setShowInputScreen}
              parameters={parameters}
              spaceId={sdk.ids.space}
              environmentId={sdk.ids.environment}
            />
          }
        </div>
        {!showInputScreen && schemas.length > 0 && contentTypes.length > 0 &&
          <>
            <div className='my-4 mt-6 font-semibold text-xl w-full ml-8'>Enable on content types</div>
            <div className='p-6 py-4 shadow-md'>
              <table className='w-full'>
                <thead className='border-b border-solid border-gray-200 font-semibold text-md'>
                  <tr>
                    <td></td>
                    <td className='p-4'>Title</td>
                    <td className='p-4'>Description</td>
                    <td className='p-4 !text-center'>Fields</td>
                  </tr>
                </thead>
                <tbody>
                  {contentTypes.map(item =>
                    <tr key={item.sys.id} className='border-b border-solid border-gray-200'>
                      <td className='p-3'>
                        <Switch
                          name={item.sys.id}
                          id={item.sys.id}
                          isChecked={isChecked(item.sys.id)}
                          onChange={() => handleSwitchChange(item.sys.id)}
                        />
                      </td>
                      <td className='p-3'>{item.name}</td>
                      <td className='p-3'>{item.description}</td>
                      <td className='p-3 !text-center'>{item.fields.length}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        }
      </div>
    </>
  );
};
