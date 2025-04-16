import { AppState, ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Box, Paragraph, List, Note, TextLink, Autocomplete, Flex, Checkbox, Pill } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { useCallback, useEffect, useState } from 'react';
import css from '@emotion/css';
// import { getRichTextFields, setAppRichTextEditor, setDefaultRichTextEditor } from '../utils';
import { CMAClient } from '@contentful/app-sdk';
// import { RtfField } from '../types';
import AsyncLock from 'async-lock';
const lock = new AsyncLock();

const JsonFieldType = 'Object';
const AppWidgetNamespace = 'app';
const BuiltinWidgetNamesspace = 'builtin';
const DefaultWidgetId = 'richTextEditor';

async function getJsonFields(cma: CMAClient, appDefinitionId: string): Promise<any[]> {
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

async function setFieldAppearance(sdk: ConfigAppSDK, contentTypeId: string, fieldId: string) {
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

async function resetFieldAppearance(sdk: ConfigAppSDK, contentTypeId: string, fieldId: string) {
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
  const [inputValue, setInputValue] = useState<string>('');
  const [jsonFieldsLoaded, setJsonFieldsLoaded] = useState<boolean>(false);
  const [isLicensed, setIsLicensed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  console.log({ contentModels, jsonFields });

  const items = jsonFields.map((field) => ({
    name: `${field.contentTypeName} > ${field.fieldName}`,
    id: field.fieldId,
    isChecked: field.isEnabled,
    contentTypeId: field.contentTypeId,
  }));

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
      console.log({ fields });
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

  function handleSelectItem(item: { name: string; id: string; isChecked: boolean; contentTypeId: string }) {
    updateRichTextField(item.contentTypeId, item.id, { isEnabled: item.isChecked });

    if (item.isChecked) {
      resetFieldAppearance(sdk, item.contentTypeId, item.id);
    } else {
      setFieldAppearance(sdk, item.contentTypeId, item.id);
    }
  }

  console.log({ jsonFields, items });

  return (
    <Flex>
      <Box>
        <>
          <Heading as="h2"> Set up Lottie Preview</Heading>
          <Paragraph>Preview your animation directly in your entry editor.</Paragraph>
        </>

        <Heading as="h2">Add Lottie Preview to your field editor</Heading>

        <Paragraph>
          Choose the content type(s) and fields you want to use with Lottie Preview. You can change this anytime in the Fields tab of your content type. To
          enable or disable Lottie Preview, click ‘Edit’ on the JSON Object field type and adjust the Appearance settings. Learn more about configuring your
          content type .
        </Paragraph>

        <Autocomplete
          items={items}
          renderItem={(item, inputValue) => {
            return (
              <Flex alignItems="center" gap={tokens.spacingXs} testId={`resource-autocomplete--${item.name}`}>
                <Checkbox value={item.id} id={item.id} isChecked={item.isChecked} isDisabled={false} onKeyDown={() => {}} />
                {item.name}
              </Flex>
            );
          }}
          onInputValueChange={setInputValue}
          onSelectItem={handleSelectItem}
          // @ts-ignore
          selectedItem={{ name: inputValue }}
          itemToString={(item) => item.name}
          textOnAfterSelect="preserve"
          closeAfterSelect={false}
          showEmptyList
          usePortal
        />
        <Flex>
          {jsonFieldsLoaded &&
            items
              .filter((item) => item.isChecked)
              .map((item) => <Pill key={item.name} label={item.name} onClose={() => console.log('remove lottie appearance')} />)}
        </Flex>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
