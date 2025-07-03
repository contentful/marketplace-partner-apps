import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Paragraph, Flex, Card, TextLink, FormLabel, Note } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useRef, useState } from 'react';
import { styles } from './ConfigScreen.styles';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { SelectContentTypeFields, hasJsonFields, jsonFields, groupFieldsByContentType } from '@contentful/app-components';

interface JsonField {
  contentTypeId: string;
  contentTypeName: string;
  fieldId: string;
  fieldName: string;
  isEnabled: boolean;
  originalEnabled: boolean;
}

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const installTriggeredRef = useRef<boolean>(false);

  const jsonFieldsRef = useRef<JsonField[]>([]);

  const onConfigure = useCallback(async () => {
    try {
      installTriggeredRef.current = true;

      // Return the current state since we update editor interfaces after configuration
      return {
        parameters: {},
        targetState: await sdk.app.getCurrentState(),
      };
    } catch (error) {
      console.error('Error in onConfigure:', error);
      sdk.notifier.error('Failed to prepare configuration. Please try again.');
      return false;
    }
  }, [sdk]);

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);
  }, [sdk, onConfigure]);

  const resetOriginalState = () => {
    jsonFieldsRef.current = jsonFieldsRef.current.map((field) => ({
      ...field,
      originalEnabled: field.isEnabled,
    }));
  };

  useEffect(() => {
    sdk.app.onConfigurationCompleted(async () => {
      if (!installTriggeredRef.current) return;

      try {
        const fieldsByContentType = groupFieldsByContentType(jsonFieldsRef.current);

        const changedContentTypes = Object.entries(fieldsByContentType).filter(([_, fields]) =>
          fields.some((field) => field.isEnabled !== field.originalEnabled)
        );

        if (changedContentTypes.length === 0) {
          resetOriginalState();
          installTriggeredRef.current = false;
          return;
        }

        const BATCH_SIZE = 10;
        const results = [];

        for (let i = 0; i < changedContentTypes.length; i += BATCH_SIZE) {
          const batch = changedContentTypes.slice(i, i + BATCH_SIZE);

          const batchResults = await Promise.allSettled(
            batch.map(async ([contentTypeId, fields]) => {
              try {
                const editorInterface = await sdk.cma.editorInterface.get({ contentTypeId });
                const existingControls = editorInterface.controls || [];

                const updatedControls = [];

                for (const field of fields) {
                  if (field.isEnabled) {
                    updatedControls.push({
                      fieldId: field.fieldId,
                      widgetId: sdk.ids.app,
                      widgetNamespace: 'app',
                    });
                  } else {
                    updatedControls.push({
                      fieldId: field.fieldId,
                      widgetId: 'objectEditor',
                      widgetNamespace: 'builtin',
                    });
                  }
                }

                for (const control of existingControls) {
                  if (!fields.some((f) => f.fieldId === control.fieldId)) {
                    updatedControls.push(control);
                  }
                }

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

          if (i + BATCH_SIZE < changedContentTypes.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        const failures = results.filter((result) => result.status === 'rejected');
        if (failures.length > 0) {
          console.error('Some editor interface updates failed:', failures);
          sdk.notifier.warning(`${failures.length} content type(s) failed to update. Check the console for details.`);
        }

        resetOriginalState();
        installTriggeredRef.current = false;
      } catch (error) {
        console.error('Error updating editor interfaces:', error);
        sdk.notifier.error('Failed to update editor interfaces. Please try again.');
      }
    });
  }, [sdk]);

  const handleSelectionChange = (newSelectedFieldIds: string[]) => {
    setSelectedFieldIds(newSelectedFieldIds);
  };

  const handleFieldDataChange = useCallback(
    (fieldData: Array<{ contentTypeId: string; contentTypeName: string; fieldId: string; fieldName: string; isAlreadyConfigured: boolean }>) => {
      const jsonFields: JsonField[] = fieldData.map(({ contentTypeId, contentTypeName, fieldId, fieldName, isAlreadyConfigured }) => ({
        contentTypeId,
        contentTypeName,
        fieldId,
        fieldName,
        originalEnabled: isAlreadyConfigured,
        isEnabled: selectedFieldIds.includes(`${contentTypeId}:${fieldId}`),
      }));

      jsonFieldsRef.current = jsonFields;
    },
    [selectedFieldIds]
  );

  useEffect(() => {
    (async () => {
      try {
        setError(null);

        sdk.app.setReady();
      } catch (err: any) {
        setError(err.message || 'Failed to load configuration. Please refreshing the page.');
        sdk.app.setReady();
      }
    })();
  }, [sdk]);

  if (error) {
    return null;
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

        <FormLabel htmlFor="content-type-fields">Select content type(s)</FormLabel>

        <SelectContentTypeFields
          cma={sdk.cma}
          selectedFieldIds={selectedFieldIds}
          onSelectionChange={handleSelectionChange}
          onFieldDataChange={handleFieldDataChange}
          contentTypeFilters={[hasJsonFields]}
          fieldFilters={[jsonFields]}
          appDefinitionId={sdk.ids.app}
          placeholder="Select content types and JSON fields..."
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
