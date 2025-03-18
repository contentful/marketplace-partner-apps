import { IApiError } from "../customTypes/IApiError";
import { IWorkflow } from "../customTypes/IWorkflow";

interface IFetchWorkflowsResponse {
  oid: string;
  workflows: IWorkflow[];
}

export default class WorkflowClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "https://console.convox.com/apis/v1";
  }

  private async request<T>(method: string, endpoint: string, deployKey: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
  
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
          'X-Deploy-Token': deployKey,
        },
      });
  
  
      if (!response.ok) {
        // treating all non-OK responses as authentication errors
        const error: IApiError = {
          message: 'Unauthorized: Invalid deploy key or missing authentication.',
          status: 401,
          type: 'unauthorized',
        };
        throw error;
      }
      const jsonResponse = await response.json();
      return jsonResponse;
    } catch (error) {
      throw {
        message: 'Unauthorized: Invalid deploy key or missing authentication.',
        status: 401,
        type: 'unauthorized',
      } as IApiError;
    }
  }

  public async fetchWorkflows(deployKey: string): Promise<IFetchWorkflowsResponse> {
      const response = await this.request<IFetchWorkflowsResponse>(
        'GET',
        '/workflows',
        deployKey
      );
      return response;
  }


  public async runWorkflow(deployKey: string, workflowId: string): Promise<string> {
      const response = await this.request<{ jod_id: string }>(
        'POST',
        `/workflows/${workflowId}/run`,
        deployKey
      );
      return response.jod_id;
  }
}
