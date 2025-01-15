import { Experiment, Flag } from '../contexts/ExperimentContext';

const US_BASE_URL = 'https://experiment.amplitude.com/api/1';
const EU_BASE_URL = 'https://experiment.eu.amplitude.com/api/1';
const LIMIT = 1000;

export type Datacenter = 'US' | 'EU';

export class AmplitudeExperimentApi {
  token: string;
  baseUrl: string;

  constructor(token: string, datacenter: Datacenter) {
    this.token = token;
    this.baseUrl = datacenter === 'US' ? US_BASE_URL : EU_BASE_URL;
  }
  fetchWithAuth(url: string) {
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
  }

  async listAllResources(isExperiment?: boolean) {
    let cursor;
    const allResources: Array<Experiment | Flag> = [];

    do {
      const { experiments, flags, nextCursor } = await this.listResources(cursor, isExperiment);
      const resources = isExperiment ? experiments : flags;
      allResources.push(...resources);
      cursor = nextCursor;
    } while (cursor);

    return allResources;
  }

  async listResources(cursor?: string, isExperiment?: boolean) {
    const response = await this.fetchWithAuth(`${this.baseUrl}/${isExperiment ? 'experiments' : 'flags'}?limit=${LIMIT}${cursor ? '&cursor=' + cursor : ''}`);
    return response.json();
  }

  async getResourceDetails(id: string, isExperiment?: boolean) {
    const response = await this.fetchWithAuth(`${this.baseUrl}/${isExperiment ? 'experiments' : 'flags'}/${id}`);
    return response.json();
  }
}
