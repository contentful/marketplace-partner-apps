import React, { useCallback, useMemo, useState } from 'react';

import { EditorAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Flex,
  Form,
  FormControl,
  Notification,
  Spinner,
} from '@contentful/f36-components';
import { EntityLink } from '@contentful/field-editor-reference';
import { useSDK } from '@contentful/react-apps-toolkit';

import { PlusIcon } from '@contentful/f36-icons';
import { AutoSaveTextInput } from '../../components/AutoSaveTextInput';
import { EppoEntrySelector } from '../../components/EppoEntrySelector';
import { ExternalEppoLinks } from '../../components/ExternalEppoLinks';
import {
  CONFIG_FORM_API_KEY_LABEL,
  CONFIG_FORM_DEFAULT_ASSIGNMENT_LABEL,
  CONFIG_FORM_DEFAULT_ENTITY_LABEL,
  DEVELOPMENT_FRONTEND_BASE_URL,
  PRODUCTION_BASE_URL,
} from '../../constants';
import { useComponentMountedHandler } from '../../hooks/useComponentMountedHandler';
import { usePublishHandler } from '../../hooks/usePublishHandler';
import {
  createContentfulExperiment,
  fetchContentfulExperiment,
} from '../../services/entry-editor-service';
import { OptionalTreatmentVariation } from './OptionalTreatmentVariation';
import { entryEditorStyles } from './styles';
import { FinishConfigSetup } from './FinishConfigSetup';
import { KeyValueMap } from '@contentful/app-sdk/dist/types/entities';

type ExperimentStatus = 'DRAFT' | 'RUNNING' | 'WRAP_UP' | 'COMPLETED';

const generateFlagKey = (entryName: string) => {
  if (!entryName) {
    return '';
  }
  const lowerSnakeCaseEntryName = entryName
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
  return `${lowerSnakeCaseEntryName}-${Date.now()}`;
};

const getFrontendBaseUrl = (): string => {
  return process.env.NODE_ENV === 'development'
    ? DEVELOPMENT_FRONTEND_BASE_URL
    : PRODUCTION_BASE_URL;
};

type ExperimentData = {
  status: ExperimentStatus;
  allocationId: number;
  experimentId: number;
  featureFlagId: number;
};

const getEntryId = (value: EntityLink | undefined): string | undefined => {
  return value?.sys?.id;
};

const getMissingConfigFields = (installationParameters: KeyValueMap) => {
  const missingFields: Array<string> = [];
  if (!installationParameters.eppoApiKey) {
    missingFields.push(CONFIG_FORM_API_KEY_LABEL);
  }
  if (!installationParameters.defaultEntityId) {
    missingFields.push(CONFIG_FORM_DEFAULT_ENTITY_LABEL);
  }
  if (!installationParameters.defaultAssignmentSourceId) {
    missingFields.push(CONFIG_FORM_DEFAULT_ASSIGNMENT_LABEL);
  }
  return missingFields;
};

const getAllowedContentTypes = (sdk: EditorAppSDK, fieldKey: string) => {
  const allowedContentTypes: Set<string> = new Set();
  sdk.entry.fields[fieldKey].validations.forEach((validation) => {
    if (validation.linkContentType) {
      validation.linkContentType.forEach((contentType) => {
        allowedContentTypes.add(contentType);
      });
    }
  });
  return Array.from(allowedContentTypes);
};

const EntryEditor: React.FC<{ sdk: EditorAppSDK }> = ({ sdk }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(Boolean(sdk.entry.getSys().publishedCounter));
  const [experimentData, setExperimentData] = useState<ExperimentData | null>(null);
  const [fieldNameErrorMessage, setFieldNameErrorMessage] = useState('');
  const [controlVariation, setControlVariation] = useState<EntityLink | undefined>(
    sdk.entry.fields.controlVariation.getValue(),
  );
  // initialize treatment variations array with a single null value if empty, so the default state is [control, treatment]
  const [treatmentVariations, setTreatmentVariations] = useState<Array<EntityLink>>(
    sdk.entry.fields.treatmentVariations.getValue() || [newEmptyVariation()],
  );
  const [controlVariationErrorMessage, setControlVariationErrorMessage] = useState('');
  const [treatmentVariationErrorMessage, setTreatmentVariationErrorMessage] = useState('');

  const treatmentVariation = treatmentVariations[0];
  const optionalTreatmentVariations = treatmentVariations.slice(1);

  const missingConfigFields = useMemo(() => {
    return getMissingConfigFields(sdk.parameters.installation);
  }, [sdk.parameters.installation]);

  const allowedContentTypes = getAllowedContentTypes(sdk, 'controlVariation');

  useComponentMountedHandler(() => {
    if (isPublished && !missingConfigFields.length) {
      const allocationId = sdk.entry.fields.allocationId.getValue() as number;
      const experimentId = sdk.entry.fields.experimentId.getValue() as number;
      fetchContentfulExperiment(sdk, allocationId, experimentId)
        .then((data) => {
          setIsLoading(false);
          setExperimentData(data);
          return;
        })
        .catch((err) => {
          setIsLoading(false);
          console.error(err);
          Notification.error(`Could not load experiment: ${err.message}`).catch(console.error);
        });
    } else {
      setIsLoading(false);
    }
  });

  usePublishHandler(sdk, () => {
    if (!isLoading) {
      setIsPublished(true);
      if (!experimentData) {
        createContentfulExperiment(sdk)
          .then((data) => {
            setExperimentData(data);
            return saveExperimentData(data);
          })
          .catch((err) => {
            console.error(err);
            Notification.error(`Could not save experiment: ${err.message}`).catch(console.error);
          });
      }
    }
  });

  const saveExperimentData = useCallback(
    async (data: ExperimentData) => {
      const { allocationId, experimentId } = data;
      const entry = sdk.entry;
      await entry.fields['allocationId'].setValue(allocationId);
      await entry.fields['experimentId'].setValue(experimentId);
      await entry.save();
    },
    [sdk.entry],
  );

  const saveControlVariationReference = useCallback(
    async (fieldKey: string, value: EntityLink | undefined) => {
      const entry = sdk.entry;
      await entry.fields[fieldKey].setValue(value);
      await entry.save();
      setControlVariation(value);
    },
    [sdk.entry],
  );

  const saveTreatmentVariationsReference = useCallback(
    async (value: EntityLink[]) => {
      const entry = sdk.entry;
      await entry.fields.treatmentVariations.setValue(value);
      await entry.save();
      setTreatmentVariations(value);
    },
    [sdk.entry],
  );

  const handleControlReferenceLinked = useCallback(
    async (value: EntityLink) => {
      await saveControlVariationReference('controlVariation', value);
      setControlVariationErrorMessage('');
    },
    [saveControlVariationReference],
  );

  const handleControlReferenceUnlinked = useCallback(async () => {
    await saveControlVariationReference('controlVariation', undefined);
    setControlVariationErrorMessage('Required');
  }, [saveControlVariationReference]);

  const handleTreatmentReferenceLinked = useCallback(
    async (value: EntityLink, i: number) => {
      const newValue = [...treatmentVariations];
      newValue[i] = value;
      await saveTreatmentVariationsReference(newValue);
      setTreatmentVariationErrorMessage('');
    },
    [saveTreatmentVariationsReference, treatmentVariations],
  );

  const handleTreatmentReferenceUnlinked = useCallback(
    async (entryId: string) => {
      const updatedTreatmentVariations = treatmentVariations.map((variation: EntityLink) =>
        getEntryId(variation) === entryId ? newEmptyVariation() : variation,
      );
      await saveTreatmentVariationsReference(updatedTreatmentVariations);
    },
    [saveTreatmentVariationsReference, treatmentVariations],
  );

  const validateEntryName = useCallback((value: string) => {
    if (!value.trim()) {
      setFieldNameErrorMessage('Required');
    } else {
      setFieldNameErrorMessage('');
    }
  }, []);

  const handleAddVariation = useCallback(async () => {
    const newValue = [...treatmentVariations, newEmptyVariation()];
    await saveTreatmentVariationsReference(newValue);
  }, [saveTreatmentVariationsReference, treatmentVariations]);

  const handleRemoveVariation = async (index: number) => {
    const newValue = treatmentVariations.filter((_, i) => i !== index);
    await saveTreatmentVariationsReference(newValue);
  };

  const hasRunningExperiment = isPublished && !!experimentData && experimentData.status !== 'DRAFT';

  if (missingConfigFields.length) {
    return <FinishConfigSetup sdk={sdk} missingConfigFields={missingConfigFields} />;
  }

  return (
    <Box
      padding="spacingL"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <Box style={{ maxWidth: '500px', flex: 1 }}>
          <Form>
            {isPublished && !!experimentData && (
              <FormControl>
                {experimentData.status === 'DRAFT' ? (
                  <ExternalEppoLinks
                    variant="negative"
                    baseUrl={getFrontendBaseUrl()}
                    featureFlagId={experimentData.featureFlagId}
                    experimentId={experimentData.experimentId}
                  >
                    Your Eppo experiment analysis and feature flag have been automatically
                    generated. Turn on the flag in Eppo to start the experiment. Some fields in this
                    entry are no longer editable since it has been already published.
                  </ExternalEppoLinks>
                ) : (
                  <ExternalEppoLinks
                    variant="primary"
                    baseUrl={getFrontendBaseUrl()}
                    featureFlagId={experimentData.featureFlagId}
                    experimentId={experimentData.experimentId}
                  >
                    Content cannot be edited because the Eppo experiment is currently running.
                  </ExternalEppoLinks>
                )}
              </FormControl>
            )}
            <FormControl className={entryEditorStyles.formControl}>
              <FormControl.Label isRequired={!hasRunningExperiment}>Entry name</FormControl.Label>
              <AutoSaveTextInput
                field={sdk.entry.fields.entryName}
                isInvalid={!!fieldNameErrorMessage}
                onChange={validateEntryName}
                onSave={(value) => {
                  if (!isPublished) {
                    const flagKey = generateFlagKey(value);
                    sdk.entry.fields.flagKey.setValue(flagKey).catch((err) => {
                      console.error(err);
                      Notification.error(err.message).catch(console.error);
                    });
                  }
                }}
                isDisabled={hasRunningExperiment}
              />
              {fieldNameErrorMessage && (
                <FormControl.ValidationMessage>
                  {fieldNameErrorMessage}
                </FormControl.ValidationMessage>
              )}
            </FormControl>
            <FormControl className={entryEditorStyles.formControl}>
              <FormControl.Label isRequired={!hasRunningExperiment}>
                Control Variation
              </FormControl.Label>
              <EppoEntrySelector
                sdk={sdk}
                fieldValue={controlVariation}
                onLink={handleControlReferenceLinked}
                onUnlink={() => handleControlReferenceUnlinked()}
                isDisabled={hasRunningExperiment}
                allowedContentTypes={allowedContentTypes}
              />
              {controlVariationErrorMessage && (
                <FormControl.ValidationMessage>
                  {controlVariationErrorMessage}
                </FormControl.ValidationMessage>
              )}
            </FormControl>
            <FormControl className={entryEditorStyles.formControl}>
              <Flex justifyContent="space-between" alignItems="center">
                <FormControl.Label isRequired={!hasRunningExperiment}>
                  Treatment Variation
                </FormControl.Label>
              </Flex>
              <EppoEntrySelector
                sdk={sdk}
                fieldValue={treatmentVariation}
                onLink={async (entry) => {
                  await handleTreatmentReferenceLinked(entry, 0);
                  setTreatmentVariationErrorMessage('');
                }}
                onUnlink={async (entryId) => {
                  await handleTreatmentReferenceUnlinked(entryId);
                  setTreatmentVariationErrorMessage('Required');
                }}
                isDisabled={hasRunningExperiment}
                allowedContentTypes={allowedContentTypes}
              />
              {treatmentVariationErrorMessage && (
                <FormControl.ValidationMessage>
                  {treatmentVariationErrorMessage}
                </FormControl.ValidationMessage>
              )}
            </FormControl>
            {optionalTreatmentVariations.map((entry: EntityLink, i: number) => (
              <OptionalTreatmentVariation
                sdk={sdk}
                treatmentIndex={i + 1}
                linkedEntry={entry}
                onLinkEntry={handleTreatmentReferenceLinked}
                onUnlinkEntry={handleTreatmentReferenceUnlinked}
                onRemoveVariation={handleRemoveVariation}
                isDisabled={hasRunningExperiment}
                allowedContentTypes={allowedContentTypes}
              />
            ))}
            {!isPublished && (
              <FormControl className={entryEditorStyles.formControl}>
                <FormControl.Label isRequired={false}>Add variation</FormControl.Label>
                <div className={entryEditorStyles.addVariationWrapper}>
                  <Button
                    variant="secondary"
                    startIcon={<PlusIcon />}
                    size="small"
                    testId="add-variation-button"
                    onClick={handleAddVariation}
                  >
                    Add variation
                  </Button>
                </div>
              </FormControl>
            )}
          </Form>
        </Box>
      )}
    </Box>
  );
};

function newEmptyVariation(): EntityLink {
  return { sys: { type: 'Link', linkType: 'Entry', id: '' } };
}

export default function EntryEditorContainer() {
  const sdk = useSDK<EditorAppSDK>();
  return <EntryEditor sdk={sdk} />;
}
