import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Paragraph, Autocomplete, Flex, Checkbox, Pill, TextLink, FormLabel, Card, Text, Note, Subheading } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { styles } from './ConfigScreen.styles';
import { ClockIcon, ExternalLinkIcon } from '@contentful/f36-icons';
import { useJsonFieldsState } from '@src/hooks/useJsonFieldsState';
import {
  buildEditorInterfaceControls,
  getJsonFields,
  getContentTypesWithJsonFieldsCount,
  groupFieldsByContentType,
  JsonFieldsResult,
  JsonField,
} from '@src/configUtils';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [inputValue, setInputValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<{ processed: number; total: number } | null>(null);
  const installTriggeredRef = useRef<boolean>(false);

  const { jsonFields, jsonFieldsRef, initialize, updateField, resetOriginalState, version } = useJsonFieldsState();

  const items = useMemo(() => {
    return jsonFields.map((field) => ({
      name: `${field.contentTypeName} > ${field.fieldName}`,
      id: field.fieldId,
      isChecked: field.isEnabled,
      contentTypeId: field.contentTypeId,
    }));
  }, [jsonFields, version]);

  const filteredItems = useMemo(() => {
    if (!inputValue) return items;
    return items.filter((item) => item.name.toLowerCase().includes(inputValue.toLowerCase()));
  }, [items, inputValue]);

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

      // Process all content types in parallel
      const updatePromises = Object.entries(fieldsByContentType).map(async ([contentTypeId, allFields]) => {
        const editorInterface = await sdk.cma.editorInterface.get({ contentTypeId });
        editorInterface.controls = buildEditorInterfaceControls(allFields, editorInterface.controls, sdk.ids.app);
        return sdk.cma.editorInterface.update(
          {
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment,
            contentTypeId,
          },
          editorInterface
        );
      });

      await Promise.all(updatePromises);
      resetOriginalState();
      installTriggeredRef.current = false;
    });
  }, [sdk]);

  useEffect(() => {
    (async () => {
      try {
        setError(null);

        const currentParameters = await sdk.app.getParameters();
        if (currentParameters) setParameters(currentParameters);

        // First, quickly check how many content types have JSON fields
        const contentTypesCount = await getContentTypesWithJsonFieldsCount(sdk.cma);
        setTotalAvailable(contentTypesCount);

        if (contentTypesCount > 50) {
          // Extreme case: Show custom loading UI with progress
          sdk.app.setReady();

          const result = await getJsonFields(sdk.cma, sdk.ids.app, { limit: 1000 }, (processed, total) => {
            setLoadingProgress({ processed, total });
          });

          initialize(result.fields);
          setIsLoading(false);
        } else {
          // Normal case: Use default Contentful loading, no custom UI
          const result = await getJsonFields(sdk.cma, sdk.ids.app, { limit: 1000 });

          initialize(result.fields);
          setIsLoading(false);
          sdk.app.setReady();
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load configuration. Please try refreshing the page.');
        setTotalAvailable(0);
        setIsLoading(false);
        initialize([]);
        sdk.app.setReady();
      }
    })();
  }, [sdk]);

  function handleSelectItem(item: { name: string; id: string; isChecked: boolean; contentTypeId: string }) {
    updateField(item.contentTypeId, item.id, {
      isEnabled: !item.isChecked,
    });
  }

  // Show error state
  if (error) {
    return (
      <Flex className={styles.wrapper}>
        <Card className={styles.configCard}>
          <Heading as="h2" className={styles.heading}>
            Configuration Error
          </Heading>
          <Note variant="negative" className={styles.note}>
            <strong>Failed to load configuration:</strong> {error}
          </Note>
          <Paragraph>
            This may be due to:
            <ul>
              <li>Too many content types causing rate limiting</li>
              <li>Network connectivity issues</li>
              <li>Insufficient permissions</li>
            </ul>
            Lottie Preview can be configured in the Fields tab of your content type. To enable or disable Lottie Preview, click 'Edit' on the JSON Object field
          </Paragraph>
        </Card>
      </Flex>
    );
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
          enable or disable Lottie Preview, click 'Edit' on the JSON Object field type and adjust the Appearance settings. Learn more about configuring your
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
        {isLoading ? (
          // Loading state while fetching content types
          <>
            {loadingProgress && (
              <Note variant="neutral" className={styles.note} icon={<ClockIcon />}>
                <Flex flexDirection="column">
                  <span>
                    <Subheading>Loading content types</Subheading>
                  </span>
                  <span>
                    {loadingProgress.processed} of {loadingProgress.total} completed
                  </span>
                </Flex>
              </Note>
            )}
          </>
        ) : (
          // Render autocomplete when loaded
          <>
            <Autocomplete
              id="autocomplete"
              items={filteredItems}
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
                There are no JSON object field types to select to use with Lottie Preview. Once you have added one to a content type, the dropdown will display
                a list of Content types with a JSON object field type.
              </Note>
            ) : (
              <>
                <Flex className={styles.pillsRow}>
                  {items
                    .filter((item) => item.isChecked)
                    .map((item) => (
                      <Pill testId={`pill-${item.id}`} key={item.name} label={item.name} onClose={() => handleSelectItem(item)} />
                    ))}
                </Flex>
              </>
            )}
          </>
        )}
      </Card>
    </Flex>
  );
};

export default ConfigScreen;
