import { AppState, ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Box, Paragraph, List, Note, TextLink, Autocomplete, Flex, Checkbox, Pill } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps, EditorInterface, EditorInterfaceProps } from 'contentful-management';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import css from '@emotion/css';
// import { getRichTextFields, setAppRichTextEditor, setDefaultRichTextEditor } from '../utils';
import { CMAClient } from '@contentful/app-sdk';
// import { RtfField } from '../types';
import AsyncLock from 'async-lock';
import cloneDeep from 'lodash/clonedeep';

const lock = new AsyncLock();

const JsonFieldType = 'Object';
const AppWidgetNamespace = 'app';
const BuiltinWidgetNamespace = 'builtin';
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
  //   const interfaceUpdatesRef = useRef<Array<any>>([]);
  const installTriggeredRef = useRef(false);

  const editorInterfaceMapRef = useRef<{ [key: string]: EditorInterfaceProps }>({});
  const jsonFieldsRef = useRef<any[]>([]);
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

  const sdk = useSDK<ConfigAppSDK>();

  type JsonField = {
    contentTypeId: string;
    fieldId: string;
    isEnabled: boolean;
  };

  function buildTargetStateFromJsonFields(appId: string) {
    const EditorInterface: Record<string, { controls: { fieldId: string; widgetId: string; widgetNamespace: string }[] }> = {};

    for (const field of jsonFieldsRef.current) {
      const { contentTypeId, fieldId, isEnabled } = field;

      // ✅ Only include fields that are explicitly enabled
      if (!isEnabled) continue;

      if (!EditorInterface[contentTypeId]) {
        EditorInterface[contentTypeId] = { controls: [] };
      }

      EditorInterface[contentTypeId].controls.push({
        fieldId,
        widgetId: appId,
        widgetNamespace: 'app',
      });
    }

    return { EditorInterface };
  }
  const onConfigure = useCallback(async () => {
    installTriggeredRef.current = true;
    return {
      parameters,
    };
  }, [parameters]);

  useEffect(() => {
    sdk.app.onConfigurationCompleted(async () => {
      if (!installTriggeredRef.current) return;

      for (const field of jsonFieldsRef.current) {
        if (!field.isEnabled) continue;

        const { contentTypeId, fieldId } = field;

        const editorInterface = await sdk.cma.editorInterface.get({ contentTypeId });

        const existingControl = editorInterface.controls?.find((c) => c.fieldId === fieldId);
        if (existingControl) {
          existingControl.widgetId = sdk.ids.app;
          existingControl.widgetNamespace = 'app';
        } else {
          editorInterface.controls!.push({
            fieldId,
            widgetId: sdk.ids.app,
            widgetNamespace: 'app',
          });
        }
        console.log({ editorInterface });
        await sdk.cma.editorInterface.update(
          {
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment,
            contentTypeId,
          },
          editorInterface
        );
      }

      installTriggeredRef.current = false;
    });
  }, []);
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
      const appDefinition = await sdk.cma.appDefinition.get({
        appDefinitionId: sdk.ids.app,
      });

      const fields = await getJsonFields(sdk.cma, sdk.ids.app);
      setJsonFields(fields);
      jsonFieldsRef.current = fields;
      setJsonFieldsLoaded(true);
    })();
  }, [sdk]);

  function updateJsonField(targetContentTypeId: string, targetFieldId: string, updatedProperties: Partial<any>) {
    setJsonFields((prevFields) => {
      const updated = prevFields.map((field) =>
        field.contentTypeId === targetContentTypeId && field.fieldId === targetFieldId ? { ...field, ...updatedProperties } : field
      );

      jsonFieldsRef.current = updated;

      return updated;
    });
  }

  async function setFieldAppearance(sdk: ConfigAppSDK, contentTypeId: string, fieldId: string) {
    lock.acquire(contentTypeId, async function () {
      const appWidgetId = sdk.ids.app;
      const fetchedInterface = await sdk.cma.editorInterface.get({ contentTypeId });
      const cloned = cloneDeep(fetchedInterface) as any;
      editorInterfaceMapRef.current[contentTypeId] = cloned;

      const control = editorInterfaceMapRef.current[contentTypeId].controls!.find((c) => c.fieldId === fieldId)!;
      control.widgetId = appWidgetId;
      control.widgetNamespace = AppWidgetNamespace;
      console.log('current ref', editorInterfaceMapRef.current[contentTypeId]);
      // editorInterface = ensureValidControlArray(editorInterface, fieldId, appWidgetId, AppWidgetNamespace);

      updateJsonField(contentTypeId, fieldId, { isEnabled: true });
    });
  }

  async function resetFieldAppearance(sdk: ConfigAppSDK, contentTypeId: string, fieldId: string) {
    lock.acquire(contentTypeId, async function () {
      // let editorInterface = editorInterfaceMapRef.current[contentTypeId];
      // if (!editorInterface) {
      //   editorInterface = await sdk.cma.editorInterface.get({ contentTypeId });
      //   editorInterfaceMapRef.current[contentTypeId] = editorInterface;
      // }
      //   ensureValidControlArray(editorInterface, fieldId, DefaultWidgetId, BuiltinWidgetNamespace);

      updateJsonField(contentTypeId, fieldId, { isEnabled: false });
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
