import { CreateFeatureAPIRequest, UpdateFeatureAPIRequest } from '../../types/feature';
import { ExperimentAPIResponse, UpdateExperimentAPIRequest, CreateExperimentAPIRequest } from '../../types/experiment';

const LIMIT = 100;

interface GrowthbookApiError {
  message: string;
}

export class GrowthbookAPI {
  serverUrl: string;
  apiKey: string;

  constructor(serverUrl: string, token: string) {
    this.apiKey = token;
    this.serverUrl = serverUrl;
  }
  fetchWithAuth(url: string) {
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
  }

  async getExperiment(experimentId: string): Promise<{ experiment: ExperimentAPIResponse } | GrowthbookApiError> {
    const response = await this.fetchWithAuth(`${this.serverUrl}/api/v1/experiments/${experimentId}`);
    return response.json();
  }

  async createExperiment(experiment: CreateExperimentAPIRequest): Promise<{ experiment: ExperimentAPIResponse } | GrowthbookApiError> {
    const response = await fetch(`${this.serverUrl}/api/v1/experiments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(experiment),
    });

    return response.json();
  }

  async createFeatureFlag(flag: CreateFeatureAPIRequest) {
    const response = await fetch(`${this.serverUrl}/api/v1/features`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(flag),
    });

    return response.json();
  }

  async updateExperiment(experimentId: string, experiment: UpdateExperimentAPIRequest): Promise<{ experiment: ExperimentAPIResponse } | GrowthbookApiError> {
    const response = await fetch(`${this.serverUrl}/api/v1/experiments/${experimentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(experiment),
    });

    return response.json();
  }

  async updateFeatureFlag(featureFlagId: string, flag: UpdateFeatureAPIRequest): Promise<CreateFeatureAPIRequest | GrowthbookApiError> {
    const response = await fetch(`${this.serverUrl}/api/v1/features/${featureFlagId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(flag),
    });

    return response.json();
  }
}
