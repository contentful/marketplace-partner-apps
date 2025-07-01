import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Paragraph, Flex, Card, TextLink, Note, Spinner, Text } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { styles } from './ConfigScreen.styles';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { ContentTypeFieldSelector, useContentTypesWithEditorInterfaces, filters } from 'contentful-app-components';
import type { ContentTypeProps, ContentFields } from 'contentful-management';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState<{ processed: number; total: number } | null>(null);
  const installTriggeredRef = useRef<boolean>(false);

  // Use the new hooks from the package
  const {
    contentTypes,
    contentTypesWithEditorInterfaces,
    loading,
    error: contentTypesError,
  } = useContentTypesWithEditorInterfaces({
    filters: [filters.hasJsonFields], // Only show content types with JSON fields
    fetchAll: true, // Fetch all content types automatically
    appDefinitionId: sdk.ids.app, // The app ID to check for in editor interfaces
    includeEditorInterfaces: true, // Fetch editor interfaces to determine current state
    onProgress: (processed, total) => {
      setLoadingProgress({ processed, total });
    },
  });

  // Convert selected field IDs back to the format expected by editor interface updates
  const selectedFieldsByContentType = useMemo(() => {
    const result: Record<string, string[]> = {};

    for (const fieldId of selectedFieldIds) {
      const [contentTypeId, fieldIdOnly] = fieldId.split(':');
      if (!result[contentTypeId]) {
        result[contentTypeId] = [];
      }
      result[contentTypeId].push(fieldIdOnly);
    }

    return result;
  }, [selectedFieldIds]);

  const onConfigure = useCallback(async () => {
    try {
      installTriggeredRef.current = true;

      // Return the current state since we update editor interfaces after configuration
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
        // Process in batches of 5 to avoid rate limits
        const BATCH_SIZE = 5;
        const results = [];

        // Process ALL content types with JSON fields, not just those with selected fields
        const allContentTypesWithJsonFields = contentTypes.filter((ct) => ct.fields.some((field) => field.type === 'Object'));

        const changedContentTypes = allContentTypesWithJsonFields.map((contentType) => {
          const contentTypeId = contentType.sys.id;
          const selectedFieldsForType = selectedFieldsByContentType[contentTypeId] || [];
          return [contentTypeId, selectedFieldsForType] as [string, string[]];
        });

        for (let i = 0; i < changedContentTypes.length; i += BATCH_SIZE) {
          const batch = changedContentTypes.slice(i, i + BATCH_SIZE);

          const batchResults = await Promise.allSettled(
            batch.map(async ([contentTypeId, fieldIds]) => {
              try {
                const contentType = contentTypes.find((ct) => ct.sys.id === contentTypeId);
                if (!contentType) return { contentTypeId, success: true, skipped: true };

                const editorInterface = await sdk.cma.editorInterface.get({ contentTypeId });
                const existingControls = editorInterface.controls || [];

                const updatedControls = [];

                // Add controls for selected fields
                for (const fieldId of fieldIds) {
                  updatedControls.push({
                    fieldId,
                    widgetId: sdk.ids.app,
                    widgetNamespace: 'app',
                  });
                }

                // For unselected JSON fields in this content type, set them back to default
                const jsonFields = contentType.fields.filter((field) => field.type === 'Object');
                for (const field of jsonFields) {
                  if (!fieldIds.includes(field.id)) {
                    updatedControls.push({
                      fieldId: field.id,
                      widgetId: 'objectEditor',
                      widgetNamespace: 'builtin',
                    });
                  }
                }

                // Add any remaining controls that weren't associated with our JSON fields
                for (const control of existingControls) {
                  if (!jsonFields.some((f) => f.id === control.fieldId)) {
                    updatedControls.push(control);
                  }
                }

                // Only update editor interface if there are changes
                if (JSON.stringify(existingControls) !== JSON.stringify(updatedControls)) {
                  await sdk.cma.editorInterface.update(
                    { contentTypeId },
                    {
                      ...editorInterface,
                      controls: updatedControls,
                    }
                  );
                  return { contentTypeId, success: true };
                } else {
                  return { contentTypeId, success: true, skipped: true };
                }
              } catch (error) {
                console.warn(`Error processing content type ${contentTypeId}:`, error);
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
        }

        installTriggeredRef.current = false;
      } catch (error) {
        console.error('Error updating editor interfaces:', error);
        sdk.notifier.error('Failed to update editor interfaces. Please try again.');
      }
    });
  }, [sdk, selectedFieldsByContentType, contentTypes]);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const currentParameters = await sdk.app.getParameters();
        if (currentParameters) setParameters(currentParameters);
        sdk.app.setReady();
      } catch (err: any) {
        setError(err.message || 'Failed to load configuration. Please try refreshing the page.');
        sdk.app.setReady();
      }
    })();
  }, [sdk]);

  // Show error state
  if (error || contentTypesError) {
    return null; // Default to contentful config page error state
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

        <ContentTypeFieldSelector
          contentTypes={contentTypes}
          selectedFieldIds={selectedFieldIds}
          contentTypesWithEditorInterfaces={contentTypesWithEditorInterfaces}
          appDefinitionId={sdk.ids.app}
          contentTypeFilters={[filters.hasJsonFields]}
          fieldFilters={[filters.jsonFields]}
          multiSelect={true}
          searchable={true}
          loading={loading}
          loadingProgress={loadingProgress}
          onSelectionChange={setSelectedFieldIds}
          placeholder="Select content types and JSON fields..."
          disabled={loading}
          renderEmptyState={() => (
            <Note variant="neutral" className={styles.note}>
              There are no JSON object field types to select to use with Lottie Preview. Once you have added one to a content type, the dropdown will display a
              list of Content types with a JSON object field type.
            </Note>
          )}
        />
      </Card>
    </Flex>
  );
};

export default ConfigScreen;
