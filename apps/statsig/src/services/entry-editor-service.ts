import { ApiRequestProps, apiRequest } from '../helpers/api-request';

import { EditorAppSDK } from '@contentful/app-sdk';
import { EntityLink } from '@contentful/field-editor-reference';

type ExperimentStatus = 'active' | 'setup' | 'decision_made' | 'abandoned' | 'archived' | 'experiment_stopped' | 'assignment_stopped';

const getGroupSizes = (numGroups: number): number[] => {
  const groupSizes = [];
  for (let i = 0; i < numGroups; i++) {
    groupSizes.push(Math.floor(100 / numGroups));
  }
  for (let i = 0; i < 100 % numGroups; i++) {
    groupSizes[i]++;
  }
  return groupSizes;
};

export type ExperimentData = {
  id: string;
  name: string;
  status: ExperimentStatus;
};

export const fetchContentfulExperiment = async (
  sdk: EditorAppSDK,
  experimentId: string,
): Promise<ExperimentData> => {
  const requestProps: ApiRequestProps = {
    method: 'GET',
    endpoint: `/contentful/v1/experiments/${experimentId}`,
    headers: {},
  };
  return await apiRequest<ExperimentData>(sdk, requestProps);
};

export const createContentfulExperiment = async (sdk: EditorAppSDK, entryName: string): Promise<ExperimentData> => {
  const treatmentVariations = sdk.entry.fields.treatmentVariations
    .getValue()
    .map((_: EntityLink, i: number) => `treatment-${i + 1}`);
  const groupNames = ['control', ...treatmentVariations];
  const groupSizes = getGroupSizes(groupNames.length);
  const groups = groupNames.map((groupName: string, i: number) => ({
    name: groupName,
    size: groupSizes[i],
    parameterValues: {
      variantName: groupName,
    },
  }));

  const requestProps: ApiRequestProps = {
    method: 'POST',
    endpoint: '/contentful/v1/experiments',
    headers: {},
    body: {
      name: `Contentful Experiment ${entryName}`,
      idType: 'userID',
      groups: groups,
    },
  };
  return await apiRequest<ExperimentData>(sdk, requestProps);
};
