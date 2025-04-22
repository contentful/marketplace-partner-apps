import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Box, Paragraph, Autocomplete, Flex, Checkbox, Pill, TextLink, FormLabel, Card } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { styles } from './Config.styles';

const JsonFieldType = 'Object';
const AppWidgetNamespace = 'app';
const DefaultWidgetId = 'objectEditor';

interface JsonField {
  contentTypeId: string;
  contentTypeName: string;
  fieldId: string;
  fieldName: string;
  isEnabled: boolean;
  originalEnabled: boolean;
}

interface Control {
  fieldId: string;
  widgetId?: string;
  widgetNamespace?: string;
}

async function getJsonFields(cma: ConfigAppSDK['cma'], appDefinitionId: string): Promise<JsonField[]> {
  const contentTypes = await cma.contentType.getMany({});
  const jsonFields: JsonField[] = [];

  for (const contentType of contentTypes.items) {
    const editorInterface = await cma.editorInterface.get({ contentTypeId: contentType.sys.id });
    for (const jsonField of contentType.fields.filter((f) => f.type === JsonFieldType)) {
      const control = editorInterface.controls?.find((w) => w.fieldId === jsonField.id);
      const isUsingApp = !!control && control.widgetId === appDefinitionId;
      jsonFields.push({
        contentTypeId: contentType.sys.id,
        contentTypeName: contentType.name,
        fieldId: jsonField.id,
        fieldName: jsonField.name,
        isEnabled: isUsingApp,
        originalEnabled: isUsingApp,
      });
    }
  }

  return jsonFields.sort((a, b) => {
    const typeCompare = a.contentTypeName.localeCompare(b.contentTypeName);
    return typeCompare !== 0 ? typeCompare : a.fieldName.localeCompare(b.fieldName);
  });
}

function groupFieldsByContentType(fields: JsonField[]): Record<string, JsonField[]> {
  return fields.reduce((acc, field) => {
    if (!acc[field.contentTypeId]) acc[field.contentTypeId] = [];
    acc[field.contentTypeId].push(field);
    return acc;
  }, {} as Record<string, JsonField[]>);
}

function buildEditorInterfaceControls(allFields: JsonField[], existingControls: Control[] = [], appId: string): Control[] {
  const managedFieldIds = new Set(allFields.map((f) => f.fieldId));

  const baseControls = existingControls.filter((c) => !managedFieldIds.has(c.fieldId));

  const updatedControls: Control[] = [
    ...baseControls,
    ...allFields.map((field) => ({
      fieldId: field.fieldId,
      widgetId: field.isEnabled ? appId : DefaultWidgetId,
      widgetNamespace: field.isEnabled ? AppWidgetNamespace : 'builtin',
    })),
  ];

  return updatedControls.filter((c) => c.fieldId && c.widgetId && c.widgetNamespace);
}

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [jsonFields, setJsonFields] = useState<JsonField[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [jsonFieldsLoaded, setJsonFieldsLoaded] = useState<boolean>(false);
  const installTriggeredRef = useRef<boolean>(false);
  const jsonFieldsRef = useRef<JsonField[]>([]);

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

  const onConfigure = useCallback(async () => {
    installTriggeredRef.current = true;
    return { parameters };
  }, [parameters]);

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);
  }, [sdk, onConfigure]);

  useEffect(() => {
    sdk.app.onConfigurationCompleted(async () => {
      if (!installTriggeredRef.current) return;

      const fieldsByContentType = groupFieldsByContentType(jsonFieldsRef.current);

      for (const [contentTypeId, allFields] of Object.entries(fieldsByContentType)) {
        const editorInterface = await sdk.cma.editorInterface.get({ contentTypeId });

        editorInterface.controls = buildEditorInterfaceControls(allFields, editorInterface.controls, sdk.ids.app);

        await sdk.cma.editorInterface.update(
          {
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment,
            contentTypeId,
          },
          editorInterface
        );
      }

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
  }, [sdk]);

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters();
      if (currentParameters) setParameters(currentParameters);

      const fields = await getJsonFields(sdk.cma, sdk.ids.app);
      setJsonFields(fields);
      jsonFieldsRef.current = fields;
      setJsonFieldsLoaded(true);
      sdk.app.setReady();
    })();
  }, [sdk]);

  function updateJsonField(contentTypeId: string, fieldId: string, updates: Partial<JsonField>) {
    setJsonFields((prev) => {
      const updated = prev.map((field) => (field.contentTypeId === contentTypeId && field.fieldId === fieldId ? { ...field, ...updates } : field));
      jsonFieldsRef.current = updated;
      return updated;
    });
  }

  function handleSelectItem(item: { name: string; id: string; isChecked: boolean; contentTypeId: string }) {
    updateJsonField(item.contentTypeId, item.id, {
      isEnabled: !item.isChecked,
    });
  }
  return (
    <Flex className={styles.wrapper}>
      <Card className={styles.configCard}>
        <Heading as="h2" className={styles.heading}>
          Set up Lottie Preview
        </Heading>
        <Paragraph className={styles.paragraph}>Preview your animation directly in your entry editor.</Paragraph>

        <hr className={styles.divider} />

        <Heading as="h2" className={styles.heading}>
          Add Lottie Preview to your field editor
        </Heading>
        <Paragraph className={styles.paragraph}>
          Choose the content type(s) and fields you want to use with Lottie Preview. You can change this anytime in the Fields tab of your content type. To
          enable or disable Lottie Preview, click ‘Edit’ on the JSON Object field type and adjust the Appearance settings. Learn more about configuring your
          content type{' '}
          <TextLink href="https://www.contentful.com/help/content-types/configure-content-type/" target="_blank" rel="noopener noreferrer">
            here
          </TextLink>
          .
        </Paragraph>

        <FormLabel htmlFor="autocomplete">Select content type(s)</FormLabel>
        <Autocomplete
          id="autocomplete"
          items={items}
          renderItem={(item) => (
            <Flex alignItems="center" gap={tokens.spacingXs} testId={`resource-autocomplete--${item.name}`}>
              <Checkbox value={item.id} id={item.id} isChecked={item.isChecked} isDisabled={false} onKeyDown={() => {}} />
              {item.name}
            </Flex>
          )}
          onInputValueChange={setInputValue}
          onSelectItem={handleSelectItem}
          //@ts-ignore
          selectedItem={{ name: inputValue }}
          itemToString={(item) => item.name}
          textOnAfterSelect="preserve"
          closeAfterSelect={false}
          showEmptyList
          usePortal
        />

        <Flex className={styles.pillsRow}>
          {jsonFieldsLoaded &&
            items.filter((item) => item.isChecked).map((item) => <Pill key={item.name} label={item.name} onClose={() => handleSelectItem(item)} />)}
        </Flex>
      </Card>
    </Flex>
  );

  // return (
  //   <Flex>
  //     <Box>
  //       <Heading as="h2">Set up Lottie Preview</Heading>
  //       <Paragraph>Preview your animation directly in your entry editor.</Paragraph>
  //       <Heading as="h2">Add Lottie Preview to your field editor</Heading>
  //       <Paragraph>
  //         Choose the content type(s) and fields you want to use with Lottie Preview. You can change this anytime in the Fields tab of your content type. To
  //         enable or disable Lottie Preview, click ‘Edit’ on the JSON Object field type and adjust the Appearance settings.
  //       </Paragraph>

  //       <Autocomplete
  //         items={items}
  //         renderItem={(item) => (
  //           <Flex alignItems="center" gap={tokens.spacingXs} testId={`resource-autocomplete--${item.name}`}>
  //             <Checkbox value={item.id} id={item.id} isChecked={item.isChecked} isDisabled={false} onKeyDown={() => {}} />
  //             {item.name}
  //           </Flex>
  //         )}
  //         onInputValueChange={setInputValue}
  //         onSelectItem={handleSelectItem}
  //         //@ts-ignore
  //         selectedItem={{ name: inputValue }}
  //         itemToString={(item) => item.name}
  //         textOnAfterSelect="preserve"
  //         closeAfterSelect={false}
  //         showEmptyList
  //         usePortal
  //       />

  //       <Flex>
  //         {jsonFieldsLoaded &&
  //           items.filter((item) => item.isChecked).map((item) => <Pill key={item.name} label={item.name} onClose={() => handleSelectItem(item)} />)}
  //       </Flex>
  //     </Box>
  //   </Flex>
  // );
};

export default ConfigScreen;
