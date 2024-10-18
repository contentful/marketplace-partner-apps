import { EditorAppSDK } from '@contentful/app-sdk';
import { EntityLink } from '@contentful/field-editor-reference';

import { apiRequest, ApiRequestProps } from '../helpers/api-request';
import { getApiBaseUrl } from '../helpers/get-api-base-url';

type ExperimentStatus = 'DRAFT' | 'RUNNING' | 'WRAP_UP' | 'COMPLETED';

export type ExperimentData = {
  status: ExperimentStatus;
  allocationId: number;
  experimentId: number;
  featureFlagId: number;
};

export const fetchContentfulExperiment = async (
  sdk: EditorAppSDK,
  allocationId: number,
  experimentId: number,
): Promise<ExperimentData> => {
  const requestProps: ApiRequestProps = {
    method: 'GET',
    url: `${getApiBaseUrl()}/api/contentful/v1/experiment`,
    headers: {
      'x-eppo-allocation-id': `${allocationId}`,
      'x-eppo-experiment-id': `${experimentId}`,
    },
  };
  return await apiRequest<ExperimentData>(sdk, requestProps);
};

export const createContentfulExperiment = async (sdk: EditorAppSDK): Promise<ExperimentData> => {
  const { entry, parameters } = sdk;
  const { fields } = entry;
  const contentfulEntryId = entry.getSys().id;
  const flagKey = fields.flagKey.getValue();
  const flagName = fields.entryName.getValue();
  const treatmentVariations = fields.treatmentVariations
    .getValue()
    .map((_: EntityLink, i: number) => `treatment-${i + 1}`);
  const variations = ['control', ...treatmentVariations];
  const entityId = parameters.installation.defaultEntityId;
  const assignmentSourceId = parameters.installation.defaultAssignmentSourceId;
  const requestProps: ApiRequestProps = {
    method: 'POST',
    url: `${getApiBaseUrl()}/api/contentful/v1/experiment`,
    body: { contentfulEntryId, flagKey, flagName, entityId, assignmentSourceId, variations },
  };
  return await apiRequest<ExperimentData>(sdk, requestProps);
};
