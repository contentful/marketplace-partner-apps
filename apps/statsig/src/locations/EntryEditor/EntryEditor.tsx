import { Box, Button, Form, FormControl, Notification, Spinner } from '@contentful/f36-components';
import { ExperimentData, createContentfulExperiment, fetchContentfulExperiment } from '../../services/entry-editor-service';
import React, { useCallback, useState } from 'react';

import { AutoSaveTextInput } from '../../components/AutoSaveTextInput';
import { EditorAppSDK } from '@contentful/app-sdk';
import { EntityLink } from '@contentful/field-editor-reference';
import { ExternalStatsigLink } from '../../components/ExternalStatsigLink';
import { OptionalTreatmentVariation } from './OptionalTreatmentVariation';
import { PlusIcon } from '@contentful/f36-icons';
import { StatsigEntrySelector } from '../../components/StatsigEntrySelector';
import { entryEditorStyles } from './styles';
import { useComponentMountedHandler } from '../../hooks/useComponentMountedHandler';
import { usePublishHandler } from '../../hooks/usePublishHandler';
import { useSDK } from '@contentful/react-apps-toolkit';

const getEntryId = (value: EntityLink | undefined): string | undefined => {
  return value?.sys?.id;
};

function newEmptyVariation(): EntityLink {
  return { sys: { type: 'Link', linkType: 'Entry', id: '' } };
}

const EntryEditor: React.FC<{ sdk: EditorAppSDK }> = ({ sdk }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(Boolean(sdk.entry.getSys().publishedCounter));
  const [experimentData, setExperimentData] = useState<ExperimentData | null>(null);

  const [controlVariation, setControlVariation] = useState<EntityLink | undefined>(
    sdk.entry.fields.controlVariation.getValue()
  );
  const [treatmentVariations, setTreatmentVariations] = useState<Array<EntityLink>>(
    sdk.entry.fields.treatmentVariations.getValue() || [newEmptyVariation()],
  );

  const [entryNameError, setEntryNameError] = useState('');
  const [controlVariationError, setControlVariationError] = useState('');
  const [treatmentVariationError, setTreatmentVariationError] = useState('');

  const treatmentVariation = treatmentVariations[0];
  const optionalTreatmentVariations = treatmentVariations.slice(1);

  useComponentMountedHandler(() => {
    if (isPublished) {
      const experimentId = sdk.entry.fields.experimentId.getValue() as string;
      fetchContentfulExperiment(sdk, experimentId)
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
        const entryName = sdk.entry.fields.entryName.getValue() as string;
        createContentfulExperiment(sdk, entryName)
          .then((data) => {
            setExperimentData(data);
            saveExperimentData(data);
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
      const entry = sdk.entry;
      await entry.fields['experimentId'].setValue(data.id);
      await entry.save();
      await entry.publish();
    },
    [sdk.entry],
  );

  const saveControlVariationReference = useCallback(
    async (value: EntityLink | undefined) => {
      const entry = sdk.entry;
      await entry.fields.controlVariation.setValue(value);
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
      await saveControlVariationReference(value);
      setControlVariationError('');
    },
    [saveControlVariationReference],
  );

  const handleControlReferenceUnlinked = useCallback(async () => {
    await saveControlVariationReference(undefined);
    setControlVariationError('Required');
  }, [saveControlVariationReference]);

  const handleTreatmentReferenceLinked = useCallback(
    async (value: EntityLink, i: number) => {
      const newValue = [...treatmentVariations];
      newValue[i] = value;
      await saveTreatmentVariationsReference(newValue);
      setTreatmentVariationError('');
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
  
  const handleAddVariation = useCallback(async () => {
    const newValue = [...treatmentVariations, newEmptyVariation()];
    await saveTreatmentVariationsReference(newValue);
  }, [saveTreatmentVariationsReference, treatmentVariations]);

  const handleRemoveVariation = async (index: number) => {
    const newValue = treatmentVariations.filter((_, i) => i !== index);
    await saveTreatmentVariationsReference(newValue);
  };

  const validateEntryName = useCallback((value: string) => {
    if (!value.trim()) {
      setEntryNameError('Required');
    } else {
      setEntryNameError('');
    }
  }, []);

  const hasRunningExperiment = isPublished && !!experimentData && experimentData.status !== 'setup';
  const { statsigProjectId } = sdk.parameters.installation;
  const url = `https://console.statsig.com/${statsigProjectId}/experiments/${experimentData?.id ?? ''}`;

  return (
    <Box
      paddingTop='spacingL'
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <Box style={{ width: '100%', flex: 1 }}>
          <Form>
            {isPublished && !!experimentData && (
              <FormControl>
                {experimentData.status === 'setup' ? (
                  <ExternalStatsigLink
                    variant="neutral"
                    url={url}
                    linkLabel='Go to Statsig Experiment'
                  >
                    Your Statsig experiment has been automatically
                    generated. Head to the below link to start the experiment.
                  </ExternalStatsigLink>
                ) : (
                  <ExternalStatsigLink
                    variant="positive"
                    url={url}
                    linkLabel='Go to Statsig Experiment'
                  >
                    Content cannot be edited because the experiment is currently running.
                    Head to the below link to see your experiment's results.
                  </ExternalStatsigLink>
                )}
              </FormControl>
            )}
            <FormControl className={entryEditorStyles.formControl}>
              <FormControl.Label isRequired={!hasRunningExperiment}>Entry Name</FormControl.Label>
              <AutoSaveTextInput
                field={sdk.entry.fields.entryName}
                onChange={validateEntryName}
                onSave={() => {}}
                isInvalid={!!entryNameError}
                isDisabled={hasRunningExperiment}
              />
              {entryNameError && (
                <FormControl.ValidationMessage>
                  {entryNameError}
                </FormControl.ValidationMessage>
              )}
            </FormControl>
            <FormControl className={entryEditorStyles.formControl}>
              <FormControl.Label isRequired={!hasRunningExperiment}>Control Variation</FormControl.Label>
              <StatsigEntrySelector
                sdk={sdk}
                fieldValue={controlVariation}
                onLink={handleControlReferenceLinked}
                onUnlink={() => handleControlReferenceUnlinked()}
                isDisabled={hasRunningExperiment}
              />
              {controlVariationError && (
                <FormControl.ValidationMessage>
                  {controlVariationError}
                </FormControl.ValidationMessage>
              )}
            </FormControl>
            <FormControl className={entryEditorStyles.formControl}>
              <FormControl.Label isRequired={!hasRunningExperiment}>Treatment Variation</FormControl.Label>
              <StatsigEntrySelector
                sdk={sdk}
                fieldValue={treatmentVariation}
                onLink={async (entry) => {
                  await handleTreatmentReferenceLinked(entry, 0);
                  setTreatmentVariationError('');
                }}
                onUnlink={async (entryId) => {
                  await handleTreatmentReferenceUnlinked(entryId);
                  setTreatmentVariationError('Required');
                }}
                isDisabled={hasRunningExperiment}
              />
              {treatmentVariationError && (
                <FormControl.ValidationMessage>
                  {treatmentVariationError}
                </FormControl.ValidationMessage>
              )}
            </FormControl>
            {optionalTreatmentVariations.map((entry: EntityLink, i: number) => (
              <OptionalTreatmentVariation
                key={i}
                sdk={sdk}
                treatmentIndex={i + 1}
                linkedEntry={entry}
                onLinkEntry={handleTreatmentReferenceLinked}
                onUnlinkEntry={handleTreatmentReferenceUnlinked}
                onRemoveVariation={handleRemoveVariation}
                isDisabled={hasRunningExperiment}
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

export default function EntryEditorContainer() {
  const sdk = useSDK<EditorAppSDK>();
  return <EntryEditor sdk={sdk} />;
}
