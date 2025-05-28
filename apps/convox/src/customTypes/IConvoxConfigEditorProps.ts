import { IWorkflow } from "./IWorkflow";
import { IWorkflowConfig } from "./IWorkflowConfig";

export interface IConvoxConfigEditorProps {
    workflowConfigs: IWorkflowConfig[];
    isAuthenticated: boolean;
    workflows: IWorkflow[],
    updateWorkflowConfigs: (workflowConfig: IWorkflowConfig, index: number) => void;
    removeWorkflowConfigs: (id: string) => void;
}
