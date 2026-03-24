import React, { useState, useEffect, useRef } from 'react';
import { SidebarAppSDK, ConfigAppSDK } from '@contentful/app-sdk';

import { Flex, Note, Text, TextLink, Spinner } from '@contentful/f36-components';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { CloudUploadIcon } from '@contentful/f36-icons';

import { TmChange, FieldType } from '../interfaces';

import bwxApi from '../api/api';

const FIELD_TYPES_ALLOWED = ['Symbol', 'Text'];

const TMUpdates = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const sdkConfig = useSDK<ConfigAppSDK>();
  const cma = useCMA();

  const locales = sdk.locales.available;
  const sourceLocale = sdk.locales.default;
  const entryId = sdk.ids.entry;

  const [changes, setTmChanges] = useState<TmChange[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false)
  const isFirstRender = useRef(true);

  const removeDuplicates = (changesArray: TmChange[]) => {
    const uniqueChanges: { [key: string]: TmChange } = {};

    changesArray.forEach(change => {
      const key = `${change.fieldId}-${change.targetLocale}`;
      uniqueChanges[key] = change;
    });

    return Object.values(uniqueChanges);
  };

  // Listen for onChange events and update the value
  useEffect(() => {
    locales.forEach(loc => {
      Object.entries(sdk.entry.fields).forEach(([key, field]) => {
        if (FIELD_TYPES_ALLOWED.includes(field.type)) {
          try {
            field.onValueChanged(loc, (newValue) => {
              if (isFirstRender.current) {
                return;
              }
              if (loc === sourceLocale) {
                return;
              }
              if ((!newValue || !newValue.trim()) || (!field.getValue() || !field.getValue().trim())) {
                return;
              }
              const change: TmChange = {
                sourceText: field.getValue(),
                targetText: newValue,
                sourceLocale: normalizeLocale(sourceLocale),
                targetLocale: normalizeLocale(loc),
                fieldType: FieldType.Text,
                fieldId: field.id
              }
              setTmChanges(prevChanges => {
                const updatedChanges = [...prevChanges, change];
                return removeDuplicates(updatedChanges);
              });
            });
          } catch (e) {
            console.error(e);
          }
        } else {
          console.log("Field type not supported ", field.type)
        }
      });
    });
  }, []);

  useEffect(() => {
    isFirstRender.current = false;

    if (changes.length) {
      let tmUpdates: any = localStorage.getItem('tmUpdates');
      if (tmUpdates) {
        tmUpdates = JSON.parse(tmUpdates);
        tmUpdates[entryId] = changes;
        localStorage.setItem('tmUpdates', JSON.stringify(tmUpdates));
      } else {
        const newItem = { [entryId]: changes }
        localStorage.setItem('tmUpdates', JSON.stringify(newItem));
      }
    }
  }, [changes]);

  useEffect(() => {
    let tmUpdates: any = localStorage.getItem('tmUpdates');
    if (tmUpdates) {
      tmUpdates = JSON.parse(tmUpdates);
      const entryTmUpdates = tmUpdates[entryId];
      if (entryTmUpdates) {
        setTmChanges(entryTmUpdates);
      }
    }
  }, []);

  const clear = () => {
    let tmUpdates: any = localStorage.getItem('tmUpdates');
    if (tmUpdates) {
      tmUpdates = JSON.parse(tmUpdates);
      tmUpdates[entryId] = [];
      localStorage.setItem('tmUpdates', JSON.stringify(tmUpdates));
      setTmChanges([]);
    }
  };

  const closeNote = () => {
    setCompleted(false);
    setError(false);
  }

  const send = async () => {
    setLoading(true);
    setCompleted(false);
    setError(false);
    try {
      await bwxApi.sendTmChanges(changes, sdkConfig, cma);
      clear();
      setCompleted(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setCompleted(false);
      setError(true);
    }
  }

  // TODO move to mapping
  const normalizeLocale = (locale: string) => {
    if (!locale) {
      return locale;
    }
    
    if (locale === 'en') {
      locale = 'en-US';
    } else if (locale === 'ar-AC') {
      locale = 'ar';
    }
    return locale.toLowerCase().replace("-", "_");
  }

  return (
    <>
    {changes.length ? 
      <> 
      <br></br>
      {loading ? (
        <Flex flexDirection="column" gap="spacing2Xs" alignItems="center">
          <Flex>
            <Text fontWeight="fontWeightDemiBold" marginRight="spacingXs" fontColor="blue500">Submitting changes</Text>
            <Spinner variant="primary" />
          </Flex>
        </Flex>
       )
       :  
       <Flex flexDirection="column" gap="spacing2Xs" alignItems="center">
        <TextLink icon={<CloudUploadIcon />} alignIcon="start" isDisabled={!changes.length} onClick={() => send()}>
          Submit changes to Translation Memory
        </TextLink>
        <Text fontSize="fontSizeS" fontWeight="fontWeightMedium" fontColor="red500">
          {`You have ${changes.length} unsaved change(s)`} 
        </Text>
      </Flex>
      }
      </>
    : <></>}
    
    {completed &&
      <div>
        <br></br>
        <Note variant="positive" withCloseButton onClose={closeNote}>
          Changes have been submitted to the Translation Memory.
        </Note>
      </div>  
    }

    {error &&
      <div>
        <br></br>
        <Note variant="negative" withCloseButton onClose={closeNote}>
          Failed to submit changes to the Translation Memory. Please try again.
        </Note>
      </div>  
    }
    </>
  );
};

export default TMUpdates;
