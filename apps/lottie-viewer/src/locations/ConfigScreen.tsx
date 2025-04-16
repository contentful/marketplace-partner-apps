import { AppState, ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Box, Paragraph, List, Note, TextLink, Autocomplete, Flex, Checkbox } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { useCallback, useEffect, useState } from 'react';
import css from '@emotion/css';
// import { getRichTextFields, setAppRichTextEditor, setDefaultRichTextEditor } from '../utils';
import { CMAClient } from '@contentful/app-sdk';
// import { RtfField } from '../types';
import AsyncLock from 'async-lock';
import { J } from 'vitest/dist/types-198fd1d9';
const lock = new AsyncLock();

const JsonFieldType = 'Object';
const AppWidgetNamespace = 'app';
const BuiltinWidgetNamesspace = 'builtin';
const DefaultWidgetId = 'richTextEditor';

export async function getJsonFields(cma: CMAClient, appDefinitionId: string): Promise<any[]> {
  // Get all content types
  const contentTypes = await cma.contentType.getMany({});

  const jsonFields: any[] = [];
  for (const contentType of contentTypes.items) {
    const editorInterface = await cma.editorInterface.get({ contentTypeId: contentType.sys.id });
    for (const jsonField of contentType.fields.filter((f) => f.type === JsonFieldType)) {
      const control = editorInterface.controls!.find((w) => w.fieldId === jsonField.id);
      jsonFields.push({
        contentTypeId: contentType.sys.id,
        contentTypeName: contentType.name,
        fieldId: jsonField.id,
        fieldName: jsonField.name,
        isEnabled: control!.widgetId === appDefinitionId,
      });
    }
  }

  jsonFields.sort((a, b) => {
    // Sort by contentTypeName first
    const typeCompare = a.contentTypeName.localeCompare(b.contentTypeName);
    if (typeCompare !== 0) {
      return typeCompare;
    }

    // Then by fieldName
    return a.fieldName.localeCompare(b.fieldName);
  });

  return jsonFields;
}

export async function setFieldAppearance(sdk: ConfigAppSDK, contentTypeId: string, fieldId: string) {
  lock.acquire(contentTypeId, async function () {
    const appWidgetId = sdk.ids.app;

    const editorInterface = await sdk.cma.editorInterface.get({ contentTypeId: contentTypeId });
    const control = editorInterface.controls!.find((w) => w.fieldId === fieldId)!;
    control.widgetId = appWidgetId;
    control.widgetNamespace = AppWidgetNamespace;

    await sdk.cma.editorInterface.update(
      {
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        contentTypeId: contentTypeId,
      },
      editorInterface
    );
  });
}

export async function resetFieldAppearance(sdk: ConfigAppSDK, contentTypeId: string, fieldId: string) {
  lock.acquire(contentTypeId, async function () {
    const editorInterface = await sdk.cma.editorInterface.get({ contentTypeId: contentTypeId });
    const control = editorInterface.controls!.find((w) => w.fieldId === fieldId)!;
    control.widgetId = DefaultWidgetId;
    control.widgetNamespace = BuiltinWidgetNamesspace;

    await sdk.cma.editorInterface.update(
      {
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        contentTypeId: contentTypeId,
      },
      editorInterface
    );
  });
}

async function getContentModels(sdk: ConfigAppSDK) {
  const types = await sdk.cma.contentType.getMany({});
  return types.items.map((x) => {
    return { label: x.name, value: x.sys.id };
  });
}
const ConfigScreen = () => {
  const [parameters, setParameters] = useState<any>({
    useImageWrapper: false,
    imageWrapperTypeId: '',
  });
  const [selectedWrapperModelId, setSelectedWrapperModelId] = useState(parameters.imageWrapperTypeId);
  const [contentModels, setContentModels] = useState<{ label: string; value: string }[]>([]);
  const [jsonFields, setJsonFields] = useState<any[]>([]);
  const [jsonFieldsLoaded, setJsonFieldsLoaded] = useState<boolean>(false);
  const [isLicensed, setIsLicensed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  console.log({ contentModels, jsonFields });

  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    if (parameters.imageWrapperTypeId && parameters.imageWrapperTypeId !== '') {
      setSelectedWrapperModelId(parameters.imageWrapperTypeId);
    }
  }, [parameters]);

  useEffect(() => {
    (async () => {
      const currentParameters: any | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }
      sdk.app.setReady();

      const models = await getContentModels(sdk);
      setContentModels(models);

      const fields = await getJsonFields(sdk.cma, sdk.ids.app);
      setJsonFields(fields);
      setJsonFieldsLoaded(true);
    })();
  }, [sdk]);

  useEffect(() => {
    let intervalId: any;
    (async () => {
      // Initial check
      const installed = await checkInstallationStatus();
      if (installed) {
        return;
      }
      // Polling
      intervalId = setInterval(async () => {
        if (await checkInstallationStatus()) {
          clearInterval(intervalId);
        }
      }, 2000);
    })();
    return () => {
      clearInterval(intervalId);
    };
  }, [sdk.app]);
  async function checkInstallationStatus(): Promise<boolean> {
    const installed = await sdk.app.isInstalled();
    setIsInstalled(installed);
    return installed;
  }

  async function enableEditorForAllRichTextFields() {
    for (const field of jsonFields.filter((f) => !f.isEnabled)) {
      updateRichTextField(field.contentTypeId, field.fieldId, { isEnabled: true });
      await setFieldAppearance(sdk, field.contentTypeId, field.fieldId);
    }
  }

  async function toggleRichTextFieldEditor(field: any) {
    const isEnabled = !field.isEnabled;
    updateRichTextField(field.contentTypeId, field.fieldId, { isEnabled });

    if (isEnabled) {
      await setFieldAppearance(sdk, field.contentTypeId, field.fieldId);
    } else {
      await resetFieldAppearance(sdk, field.contentTypeId, field.fieldId);
    }
  }

  function updateRichTextField(targetContentTypeId: string, targetFieldId: string, updatedProperties: Partial<any>) {
    setJsonFields((prevFields) =>
      prevFields.map((field) => (field.contentTypeId === targetContentTypeId && field.fieldId === targetFieldId ? { ...field, ...updatedProperties } : field))
    );
  }
  return (
    <>
      <Box>
        <>
          <Heading as="h2"> About Surfer</Heading>

          <Paragraph>
            Elevate your content SEO with Surfer without leaving Contentful! Generate a list of relevant keywords, create an outline and write amazingly
            optimized content while getting real-time feedback from our Content Editor.
          </Paragraph>
          <Note variant="neutral">
            You need a Surfer account with an active subscription to use this app. Sign up{' '}
            <TextLink href="https://app.surferseo.com/register" target="_blank">
              here
            </TextLink>
            .
          </Note>
        </>

        <Heading>Select content types and fields</Heading>

        <Autocomplete
          items={[{ name: 'inputName', id: 'inputId' }]}
          renderItem={(item, inputValue) => {
            return (
              <Flex alignItems="center" gap={tokens.spacingXs} testId={`resource-autocomplete--${item.name}`}>
                <Checkbox value={item.id} id={item.id} isChecked isDisabled={false} onKeyDown={() => {}} />
              </Flex>
            );
          }}
          onInputValueChange={(e) => console.log(e)}
          onSelectItem={(item) => console.log(item)}
          selectedItem={{ name: 'inputName' }}
          itemToString={(item) => item.name}
        />
      </Box>
    </>
  );
};

export default ConfigScreen;
