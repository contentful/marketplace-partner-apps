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
        isEnabled: !!control && control.widgetId === appDefinitionId,
        originalEnabled: !!control && control.widgetId === appDefinitionId,
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
  const installTriggeredRef = useRef(false);
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
    fieldName: string;
    contentTypeName: string;
    isEnabled: boolean;
    originalEnabled: boolean;
  };

  const onConfigure = useCallback(async () => {
    installTriggeredRef.current = true;
    return {
      parameters,
    };
  }, [parameters]);

  useEffect(() => {
    sdk.app.onConfigurationCompleted(async () => {
      if (!installTriggeredRef.current) return;

      const fieldsByContentType: Record<string, JsonField[]> = {};

      for (const field of jsonFieldsRef.current) {
        if (!fieldsByContentType[field.contentTypeId]) {
          fieldsByContentType[field.contentTypeId] = [];
        }
        fieldsByContentType[field.contentTypeId].push(field);
      }

      for (const [contentTypeId, allFields] of Object.entries(fieldsByContentType)) {
        const editorInterface = await sdk.cma.editorInterface.get({ contentTypeId });

        // Remove any controls for fields we're managing (full list)
        const managedFieldIds = new Set(allFields.map((f) => f.fieldId));
        const baseControls = (editorInterface.controls || []).filter((c) => !managedFieldIds.has(c.fieldId));

        // Add current desired state for all fields
        const updatedControls = [
          ...baseControls,
          ...allFields.map((field) => ({
            fieldId: field.fieldId,
            widgetId: field.isEnabled ? sdk.ids.app : 'objectEditor',
            widgetNamespace: field.isEnabled ? 'app' : 'builtin',
          })),
        ];

        // Final sanity check
        editorInterface.controls = updatedControls.filter((c) => c.fieldId && c.widgetId && c.widgetNamespace);

        console.log(`🛠 Final controls for ${contentTypeId}:`, editorInterface.controls);

        await sdk.cma.editorInterface.update(
          {
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment,
            contentTypeId,
          },
          editorInterface
        );
      }

      // Sync original state
      setJsonFields((prev) =>
        prev.map((f) => ({
          ...f,
          originalEnabled: f.isEnabled,
        }))
      );
      jsonFieldsRef.current = jsonFieldsRef.current.map((f) => ({
        ...f,
        originalEnabled: f.isEnabled,
      }));

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

  async function handleSelectItem(item: { name: string; id: string; isChecked: boolean; contentTypeId: string }) {
    updateJsonField(item.contentTypeId, item.id, { isEnabled: !item.isChecked });
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
