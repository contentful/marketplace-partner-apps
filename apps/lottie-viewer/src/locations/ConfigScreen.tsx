import { AppState, ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Box, Paragraph, List, Note, TextLink, Autocomplete, Flex, Checkbox, Pill } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { useCallback, useEffect, useMemo, useState } from 'react';
import css from '@emotion/css';
// import { getRichTextFields, setAppRichTextEditor, setDefaultRichTextEditor } from '../utils';
import { CMAClient } from '@contentful/app-sdk';
// import { RtfField } from '../types';
import AsyncLock from 'async-lock';
const lock = new AsyncLock();

const JsonFieldType = 'Object';
const AppWidgetNamespace = 'app';
const BuiltinWidgetNamesspace = 'builtin';
const DefaultWidgetId = 'objectEditor';

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

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<any>({
    useImageWrapper: false,
    imageWrapperTypeId: '',
  });
  const [jsonFields, setJsonFields] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [jsonFieldsLoaded, setJsonFieldsLoaded] = useState<boolean>(false);
  const [interfaceUpdates, setInterfaceUpdates] = useState<any[]>([]);
  const items = useMemo(
    () =>
      jsonFields.map((field) => ({
        name: `${field.contentTypeName} > ${field.fieldName}`,
        id: field.fieldId,
        isChecked: field.isEnabled,
        contentTypeId: field.contentTypeId,
      })),
    [jsonFields]
  );

  console.log({ interfaceUpdates });

  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    console.log('on configure', interfaceUpdates);
    const currentState = await sdk.app.getCurrentState();
    await sdk.cma.editorInterface.update(interfaceUpdates[0].params, interfaceUpdates[0].updatedInterface);
    // interfaceUpdates.forEach(async (i) => await sdk.cma.editorInterface.update(i.params, i.updatedInterface));
    console.log('on configure 2');

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: any | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }
      sdk.app.setReady();

      const fields = await getJsonFields(sdk.cma, sdk.ids.app);
      setJsonFields(fields);
      setJsonFieldsLoaded(true);
    })();
  }, [sdk]);

  function updateJsonField(targetContentTypeId: string, targetFieldId: string, updatedProperties: Partial<any>) {
    setJsonFields((prevFields) =>
      prevFields.map((field) => (field.contentTypeId === targetContentTypeId && field.fieldId === targetFieldId ? { ...field, ...updatedProperties } : field))
    );
  }

  async function setFieldAppearance(sdk: ConfigAppSDK, contentTypeId: string, fieldId: string) {
    lock.acquire(contentTypeId, async function () {
      const appWidgetId = sdk.ids.app;
      const editorInterface = await sdk.cma.editorInterface.get({ contentTypeId: contentTypeId });
      const control = editorInterface.controls!.find((w) => w.fieldId === fieldId)!;
      control.widgetId = appWidgetId;
      control.widgetNamespace = AppWidgetNamespace;
      console.log({ editorInterface });
      setInterfaceUpdates((prev) => [
        ...prev,
        { updatedInterface: editorInterface, params: { spaceId: sdk.ids.space, environmentId: sdk.ids.environment, contentTypeId: contentTypeId } },
      ]);

      //   return editorInterface;
      console.log('set appearance', { editorInterface });

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
      console.log({ editorInterface });
      setInterfaceUpdates((prev) => [
        ...prev,
        { updatedInterface: editorInterface, params: { spaceId: sdk.ids.space, environmentId: sdk.ids.environment, contentTypeId: contentTypeId } },
      ]);
      //   await sdk.cma.editorInterface.update(
      //     {
      //       spaceId: sdk.ids.space,
      //       environmentId: sdk.ids.environment,
      //       contentTypeId: contentTypeId,
      //     },
      //     editorInterface
      //   );
      return editorInterface;
    });
  }

  async function handleSelectItem(item: { name: string; id: string; isChecked: boolean; contentTypeId: string }) {
    updateJsonField(item.contentTypeId, item.id, { isEnabled: !item.isChecked });

    if (item.isChecked) {
      await resetFieldAppearance(sdk, item.contentTypeId, item.id);
    } else {
      await setFieldAppearance(sdk, item.contentTypeId, item.id);
    }
  }

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
            items.filter((item) => item.isChecked).map((item) => <Pill key={item.name} label={item.name} onClose={() => handleSelectItem(item)} />)}
        </Flex>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
