import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Paragraph, Autocomplete, Flex, Checkbox, Pill, TextLink, FormLabel, Card, Text, Note, Subheading } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { styles } from './ConfigScreen.styles';
import { ClockIcon, ExternalLinkIcon } from '@contentful/f36-icons';
import { useJsonFieldsState } from '@src/hooks/useJsonFieldsState';
import { getJsonFields, getContentTypesWithJsonFieldsCount, groupFieldsByContentType, JsonFieldsResult, JsonField } from '@src/configUtils';

const AppWidgetNamespace = 'app';
const DefaultWidgetId = 'objectEditor';

interface AppState {
  fields: JsonField[];
}

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [inputValue, setInputValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<{ processed: number; total: number } | null>(null);
  const installTriggeredRef = useRef<boolean>(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [originalState, setOriginalState] = useState<JsonFieldsResult | null>(null);

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
    try {
      installTriggeredRef.current = true;

      // Return the current state since we'll update editor interfaces after configuration
      return {
        parameters,
        targetState: await sdk.app.getCurrentState(),
      };
    } catch (error) {
      console.error('Error in onConfigure:', error);
      sdk.notifier.error('Failed to prepare configuration. Please try again.');
      return false;
    }
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);
  }, [sdk, onConfigure]);

  useEffect(() => {
    sdk.app.onConfigurationCompleted(async () => {
      if (!installTriggeredRef.current) return;

      try {
        const fieldsByContentType = groupFieldsByContentType(jsonFieldsRef.current);

        // Only process content types that have changes
        const changedContentTypes = Object.entries(fieldsByContentType).filter(([_, fields]) =>
          fields.some((field) => field.isEnabled !== field.originalEnabled)
        );

        if (changedContentTypes.length === 0) {
          console.log('No changes detected, skipping editor interface updates');
          resetOriginalState();
          installTriggeredRef.current = false;
          return;
        }

        console.log(`Processing ${changedContentTypes.length} content types with changes`);

        // Process in batches of 5 to avoid rate limits
        const BATCH_SIZE = 5;
        const results = [];

        for (let i = 0; i < changedContentTypes.length; i += BATCH_SIZE) {
          const batch = changedContentTypes.slice(i, i + BATCH_SIZE);
          console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(changedContentTypes.length / BATCH_SIZE)}`);

          const batchResults = await Promise.allSettled(
            batch.map(async ([contentTypeId, fields]) => {
              try {
                // Get the editor interface
                const editorInterface = await sdk.cma.editorInterface.get({ contentTypeId });
                const existingControls = editorInterface.controls || [];

                // Build new controls array
                const updatedControls = [];

                // Process each field
                for (const field of fields) {
                  if (field.isEnabled) {
                    // Add our app's control for enabled fields
                    updatedControls.push({
                      fieldId: field.fieldId,
                      widgetId: sdk.ids.app,
                      widgetNamespace: 'app',
                    });
                  } else {
                    // For disabled fields, set them back to the default Object widget
                    updatedControls.push({
                      fieldId: field.fieldId,
                      widgetId: 'objectEditor',
                      widgetNamespace: 'builtin',
                    });
                  }
                }

                // Add any remaining controls that weren't associated with our JSON fields
                for (const control of existingControls) {
                  if (!fields.some((f) => f.fieldId === control.fieldId)) {
                    updatedControls.push(control);
                  }
                }

                // Only update if there are actual changes
                if (JSON.stringify(existingControls) !== JSON.stringify(updatedControls)) {
                  console.log(`Updating controls for ${contentTypeId}:`, updatedControls);

                  // Update the editor interface directly
                  await sdk.cma.editorInterface.update(
                    { contentTypeId },
                    {
                      ...editorInterface,
                      controls: updatedControls,
                    }
                  );
                  return { contentTypeId, success: true };
                } else {
                  console.log(`No changes needed for ${contentTypeId}`);
                  return { contentTypeId, success: true, skipped: true };
                }
              } catch (error) {
                console.error(`Error processing content type ${contentTypeId}:`, error);
                throw error;
              }
            })
          );

          results.push(...batchResults);

          // Add a small delay between batches to avoid rate limits
          if (i + BATCH_SIZE < changedContentTypes.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        // Check if any updates failed
        const failures = results.filter((result) => result.status === 'rejected');
        if (failures.length > 0) {
          console.error('Some editor interface updates failed:', failures);
          sdk.notifier.warning(`${failures.length} content type(s) failed to update. Check the console for details.`);
        } else {
          const skipped = results.filter((result) => result.status === 'fulfilled' && (result.value as any).skipped).length;
          const updated = results.length - failures.length - skipped;
          console.log(`Successfully updated ${updated} content type(s), skipped ${skipped}`);
        }

        resetOriginalState();
        installTriggeredRef.current = false;
      } catch (error) {
        console.error('Error updating editor interfaces:', error);
        sdk.notifier.error('Failed to update editor interfaces. Please try again.');
      }
    });
  }, [sdk, jsonFieldsRef]);

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

          const result = await getJsonFields(sdk.cma, sdk.ids.app, { limit: 1000 }, async (processed, total) => {
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
