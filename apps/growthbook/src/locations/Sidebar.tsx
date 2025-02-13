import React, { useCallback, useContext, useEffect, useState } from 'react';
import get from 'lodash/get';
import { Paragraph, Button, Stack, Tooltip, Note } from '@contentful/f36-components';
import { Entry, SidebarAppSDK } from '@contentful/app-sdk';
import { useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { GrowthbookAPIContext } from '../contexts/GrowthbookAPIContext';
import { ExperimentAPIResponse } from '../../types/experiment';
import Link from 'next/link';
import { ContentTypesContext } from '../contexts/ContentTypesContext';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();

  const { growthbookAPI: growthbookExperimentApi } = useContext(GrowthbookAPIContext);

  const [formExperimentName, setFormExperimentName] = useFieldValue<string>(sdk.entry.fields.experimentName.id);

  const [formFeatureFlagId, setFormFeatureFlagId] = useFieldValue<string>(sdk.entry.fields.featureFlagId.id);

  const [formTrackingKey, setFormTrackingKey] = useFieldValue<string>(sdk.entry.fields.trackingKey.id);

  const [formExperiment, setFormExperiment] = useFieldValue<ExperimentAPIResponse>(sdk.entry.fields.experiment.id);

  const [experimentId, setExperimentId] = useState(formExperiment?.id || '');

  const [formVariations] = useFieldValue<Entry[]>(sdk.entry.fields.variations.id);

  const [variationNames] = useFieldValue<string[]>(sdk.entry.fields.variationNames.id);

  const [error, setError] = useState<React.ReactNode>();

  const { contentTypes } = useContext(ContentTypesContext);

  let showUpdateButton = false;

  const displayError = useCallback(
    (error: string) => {
      const configUrl = `https://app.contentful.com/spaces/${sdk.ids.space}/apps/${sdk.ids.app}`;
      if (error.includes('is not valid JSON')) {
        setError(
          <>
            The server {sdk.parameters.installation.growthbookServerUrl} did not return valid JSON. It is possible that the server is not set correctly
            (api.growthbook.io for Growthbook Cloud). Go to the{' '}
            <a href={configUrl} target="_blank">
              Configuration page
            </a>{' '}
            to edit.
          </>
        );
      } else if (error.includes('Invalid data source')) {
        setError(
          <>
            Datasource {sdk.parameters.installation.datasourceId} is invalid. Go to the{' '}
            <a href={configUrl} target="_blank">
              Configuration page
            </a>{' '}
            to edit.
          </>
        );
      } else if (error.includes('Failed to fetch')) {
        setError(
          <>
            Failed to fetch from {sdk.parameters.installation.growthbookServerUrl}. Go to the{' '}
            <a href={configUrl} target="_blank">
              Configuration page
            </a>{' '}
            to edit.
          </>
        );
      } else if (error.includes('Invalid API key')) {
        setError(
          <>
            The API key is invalid. Go to the{' '}
            <a href={configUrl} target="_blank">
              Configuration page
            </a>{' '}
            to edit.{' '}
          </>
        );
      } else {
        setError(<>{error}</>);
      }
    },
    [sdk.ids.space, sdk.ids.app, sdk.parameters.installation.datasourceId, sdk.parameters.installation.growthbookServerUrl]
  );

  useEffect(() => {
    const fetchExperiment = async () => {
      try {
        if (experimentId) {
          const results = await growthbookExperimentApi?.getExperiment(experimentId);
          if (!results || !('experiment' in results)) {
            displayError(results?.message || 'Failed to fetch experiment.');
            return;
          }
          setFormExperiment(results['experiment']);
        }
      } catch (error: any) {
        displayError(error.message);
      }
    };
    fetchExperiment();
  }, [experimentId, growthbookExperimentApi, setFormExperiment, displayError]);

  if (formExperiment && variationNames) {
    const varationNamesFromExperient = formExperiment?.variations.map((variation) => variation.name);
    //check if variation names from experiment and variation names from contentful are the same
    showUpdateButton = variationNames.join() !== varationNamesFromExperient.join();
  }

  const getDescription = async () => {
    if (formVariations && formVariations.length > 0) {
      try {
        // Capturing when a variation's title changes in the EntryEditor is hard, so
        // we need to fetch the variations at the last moment to ensure we have the latest data.
        const entries = await Promise.all(formVariations.map((variation) => sdk.cma.entry.get({ entryId: variation.sys.id })));
        return `Created from [Contentful](https://app.contentful.com/spaces/${sdk.ids.space}/entries/${sdk.entry.getSys().id}).  

#### Variations  
${entries
  .map((entry, i) => {
    const contentType = contentTypes.find((ct) => ct.sys.id === entry.sys.contentType.sys.id);
    if (!contentType || !variationNames) {
      return 'Unknown';
    }
    const displayField = contentType.displayField;
    return `**${variationNames[i]}**: ` + get(entry, ['fields', displayField, sdk.locales.default], 'Untitled');
  })
  .join('  \n')}
        `;
      } catch (err) {
        setError('Failed to load variations');
        return '';
      }
    }
    return '';
  };

  const handleCreate = async () => {
    setError(null);
    try {
      const trimmedFormExperimentName = formExperimentName?.trim();
      setFormExperimentName(trimmedFormExperimentName);
      if (!experimentId && trimmedFormExperimentName && formVariations && variationNames) {
        const slugifiedExperimentName = trimmedFormExperimentName.toLowerCase().replace(/\s+/g, '-');
        const featureFlagId = slugifiedExperimentName;
        const trackingKey = slugifiedExperimentName;
        setFormFeatureFlagId(featureFlagId);
        setFormTrackingKey(trackingKey);

        const results = await growthbookExperimentApi?.createExperiment({
          datasourceId: sdk.parameters.installation.datasourceId,
          assignmentQueryId: 'user_id',
          trackingKey,
          name: trimmedFormExperimentName,
          variations: formVariations.map((variation, index) => {
            return {
              name: variationNames[index],
              key: index.toString(),
              id: variation.sys.id,
            };
          }),
          description: await getDescription(),
        });

        if (!results || !('experiment' in results)) {
          throw new Error(results?.message || 'Failed to create experiment');
        }

        const newExperiment = results['experiment'] as ExperimentAPIResponse;
        setExperimentId(newExperiment.id);
        setFormExperiment(newExperiment);

        // need to wait for the experiment for eventually consistency
        setTimeout(async () => {
          const results = await growthbookExperimentApi?.createFeatureFlag({
            id: featureFlagId,
            owner: sdk.user.email,
            valueType: 'string',
            defaultValue: '0',
            environments: {
              production: {
                enabled: true,
                rules: [
                  {
                    type: 'experiment-ref',
                    experimentId: newExperiment.id,
                    enabled: true,
                    variations: newExperiment.variations.map((variation, index) => {
                      return {
                        variationId: variation.variationId,
                        value: index.toString(),
                      };
                    }),
                  },
                ],
              },
            },
          });

          if (!results || !results['feature']) {
            displayError(results?.message || 'Failed to create feature flag.');
          }
        }, 5000);
      }
    } catch (error: any) {
      displayError(error.message);
    }
  };

  const handleUpdate = async () => {
    setError(null);
    try {
      setFormExperimentName(formExperimentName?.trim());
      if (experimentId && formFeatureFlagId && formTrackingKey && formExperimentName && formVariations && variationNames) {
        // set variation weights to equal split by default
        // users can go to Growthbook to adjust the weights if they want something different
        const updatedPhases = formExperiment?.phases.map((phase) => {
          return {
            ...phase,
            variationWeights: Array.from({ length: formVariations.length }, () => 1 / formVariations.length),
          };
        });

        const results = await growthbookExperimentApi?.updateExperiment(experimentId, {
          assignmentQueryId: 'user_id',
          trackingKey: formTrackingKey,
          name: formExperimentName,
          variations: formVariations.map((variation, index) => {
            return {
              name: variationNames[index],
              key: index.toString(),
              id: variation.sys.id,
            };
          }),
          phases: updatedPhases,
          description: await getDescription(),
        });

        if (!results || !('experiment' in results)) {
          throw new Error(results?.message || 'Failed to update experiment');
        }

        const updatedExperiment = results['experiment'] as ExperimentAPIResponse;
        setFormExperiment(updatedExperiment);

        const ffResults = await growthbookExperimentApi?.updateFeatureFlag(formFeatureFlagId, {
          owner: sdk.user.email,
          defaultValue: '0',
          environments: {
            production: {
              enabled: true,
              rules: [
                {
                  type: 'experiment-ref',
                  experimentId: updatedExperiment.id,
                  enabled: true,
                  variations: updatedExperiment.variations.map((variation, index) => {
                    return {
                      variationId: variation.variationId,
                      value: index.toString(),
                    };
                  }),
                },
              ],
            },
          },
        });

        if (!ffResults || 'message' in ffResults) {
          throw new Error(ffResults?.message || 'Failed to update feature flag');
        }
      }
    } catch (error: any) {
      displayError(error.message);
    }
  };

  const handleStartClick = async () => {
    setError(null);
    try {
      const results = await growthbookExperimentApi?.updateExperiment(experimentId, {
        status: 'running',
      });
      if (!results || 'message' in results) {
        throw new Error(results?.message || 'Failed to start experiment');
      }
      const updatedExperiment = results['experiment'];
      setFormExperiment(updatedExperiment);
    } catch (error: any) {
      displayError(error.message);
    }
  };

  const canCreate = !!(formExperimentName && formVariations && formVariations.length >= 2);

  const winnerIndex = formExperiment?.resultSummary?.winner
    ? formExperiment.variations.findIndex((variation) => variation.variationId === formExperiment.resultSummary?.winner)
    : -1;
  const winner = variationNames && winnerIndex > -1 ? variationNames[winnerIndex] : undefined;

  return (
    <Stack
      spacing="spacingXs" // Reduced spacing
      flexDirection="column"
      alignItems="flex-start">
      {formExperiment && (
        <>
          <Paragraph>
            <b>Experiment Status</b>: {formExperiment.status}
            {showUpdateButton ? ', out of sync' : ''}
            {winner && (
              <>
                <br />
                <b>Results</b>: {winner} is the winning variation
              </>
            )}
            <br />
            <Link href={`https://app.growthbook.io/experiment/${experimentId}`} target="_blank">
              View Experiment on Growthbook
            </Link>
          </Paragraph>
        </>
      )}
      {!experimentId && (
        <Tooltip content={!canCreate ? 'An experiment needs a name and at least two variations.' : ''}>
          <Button onClick={handleCreate} style={{ display: 'block', marginBottom: '0px' }} isDisabled={!canCreate}>
            Create New Experiment
          </Button>
        </Tooltip>
      )}
      {showUpdateButton && (
        <Tooltip content={formVariations?.length != variationNames?.length ? 'Create or link an existing entry for each variation.' : ''}>
          <Button onClick={handleUpdate} style={{ display: 'block', marginBottom: '0px' }} isDisabled={formVariations?.length != variationNames?.length}>
            Update Experiment
          </Button>
        </Tooltip>
      )}
      {!showUpdateButton && formExperiment && formExperiment.status != 'running' && !winner && (
        <Tooltip content="Once you start an experiment and users see it, updating it will invalidate the results.">
          <Button onClick={handleStartClick} style={{ display: 'block', marginBottom: '0px' }} isDisabled={formVariations?.length != variationNames?.length}>
            Start Experiment
          </Button>
        </Tooltip>
      )}
      {error && <Note variant="negative">{error}</Note>}
    </Stack>
  );
};

export default Sidebar;
