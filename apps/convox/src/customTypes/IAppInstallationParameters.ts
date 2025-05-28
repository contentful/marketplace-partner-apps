import { IWorkflowConfig } from "./IWorkflowConfig";

export interface IAppInstallationParameters {
  workflowConfigs: IWorkflowConfig[];
  convoxDeployKey: string;
  selectedContentTypes: string[];
}
