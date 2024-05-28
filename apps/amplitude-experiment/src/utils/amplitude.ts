import { Experiment } from "../contexts/ExperimentContext";

const BASE_URL = "https://experiment.amplitude.com/api/1";
const LIMIT = 1000;
export class AmplitudeExperimentApi {
  token: string;

  constructor(token: string) {
    this.token = token;
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
      `${BASE_URL}/experiments?limit=${LIMIT}${cursor ? "&cursor=" + cursor : ''}`
    );
    return response.json();
  }

  async getExperimentDetails(experimentId: string) {
    const response = await this.fetchWithAuth(
      `${BASE_URL}/experiments/${experimentId}`
    );
    return response.json();
  }
}
