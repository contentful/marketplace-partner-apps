import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Paragraph, Autocomplete, Flex, Checkbox, Pill, TextLink, FormLabel, Card, Text, Note } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { styles } from './ConfigScreen.styles';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { useJsonFieldsState } from '@src/hooks/useJsonFieldsState';
import { buildEditorInterfaceControls, getJsonFields, groupFieldsByContentType } from '@src/configUtils';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [inputValue, setInputValue] = useState<string>('');
  const installTriggeredRef = useRef<boolean>(false);

  const { jsonFields, jsonFieldsRef, initialize, updateField, resetOriginalState } = useJsonFieldsState();

  const items = useMemo(
    () =>
      jsonFields
        .map((field) => ({
          name: `${field.contentTypeName} > ${field.fieldName}`,
          id: field.fieldId,
          isChecked: field.isEnabled,
          contentTypeId: field.contentTypeId,
        }))
        .filter((item) => item.name.toLowerCase().includes(inputValue.toLowerCase())),
    [jsonFields, inputValue]
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
      resetOriginalState();
      installTriggeredRef.current = false;
    });
  }, [sdk]);

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters();
      if (currentParameters) setParameters(currentParameters);
      const fields = await getJsonFields(sdk.cma, sdk.ids.app);
      initialize(fields);
      sdk.app.setReady();
    })();
  }, [sdk]);

  function handleSelectItem(item: { name: string; id: string; isChecked: boolean; contentTypeId: string }) {
    updateField(item.contentTypeId, item.id, {
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
          <TextLink
            className={styles.textLink}
            icon={<ExternalLinkIcon size="tiny" />}
            alignIcon="end"
            href="https://www.contentful.com/help/content-types/configure-content-type/"
            target="_blank"
            rel="noopener noreferrer">
            here
          </TextLink>{' '}
          .
        </Paragraph>

        <FormLabel htmlFor="autocomplete">Select content type(s)</FormLabel>
        <Autocomplete
          id="autocomplete"
          items={items}
          renderItem={(item) => (
            <Flex alignItems="center" gap={tokens.spacingXs} testId={`resource-autocomplete--${item.name}`}>
              <Checkbox testId={`checkbox-${item.id}`} value={item.id} id={item.id} isChecked={item.isChecked} isDisabled={false} onChange={() => {}} />
              <Text fontWeight="fontWeightMedium">{item.name}</Text>
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
          listWidth="full"
          usePortal
          isDisabled={!jsonFields.length}
        />
        {!jsonFields.length ? (
          <Note variant="neutral" className={styles.note}>
            There are no JSON object field types to select to use with Lottie Preview. Once you have added one to a content type, it will appear here.
          </Note>
        ) : (
          <Flex className={styles.pillsRow}>
            {items
              .filter((item) => item.isChecked)
              .map((item) => (
                <Pill testId={`pill-${item.id}`} key={item.name} label={item.name} onClose={() => handleSelectItem(item)} />
              ))}
          </Flex>
        )}
      </Card>
    </Flex>
  );
};

export default ConfigScreen;
