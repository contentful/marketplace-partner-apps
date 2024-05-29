import { Experiment } from "../contexts/ExperimentContext";

const US_BASE_URL = "https://experiment.amplitude.com/api/1";
const EU_BASE_URL = "https://experiment.eu.amplitude.com/api/1";
const LIMIT = 1000;

export type Datacenter = "US" | "EU";

export class AmplitudeExperimentApi {
  token: string;
  baseUrl: string;

  constructor(token: string, datacenter: Datacenter) {
    this.token = token;
    this.baseUrl = datacenter === "US" ? US_BASE_URL : EU_BASE_URL;
  }
  fetchWithAuth(url: string) {
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
  }

  async listAllExperiments() {
    let cursor;
    const allExperiments: Array<Experiment> = [];

    const { experiments, nextCursor } = await this.listExperiments();
    cursor = nextCursor;
    allExperiments.push(...experiments);

    while (cursor) {
      const res = await this.listExperiments(cursor);
      let nCursor = res.nextCursor, nExperiments = res.experiments;
      allExperiments.push(...nExperiments);
      cursor = nCursor;
    }
    return allExperiments;
  }

  async listExperiments(cursor?: string) {
    const response = await this.fetchWithAuth(
      `${this.baseUrl}/experiments?limit=${LIMIT}${cursor ? "&cursor=" + cursor : ''}`
    );
    return response.json();
  }

  async getExperimentDetails(experimentId: string) {
    const response = await this.fetchWithAuth(
      `${this.baseUrl}/experiments/${experimentId}`
    );
    return response.json();
  }
}
