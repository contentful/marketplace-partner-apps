import { IWorkflow } from "./IWorkflow";
import { IWorkflowConfig } from "./IWorkflowConfig";

export interface ISiteConfigModalProps {
    isShown: boolean;
    workflowConfigs: IWorkflowConfig[];
    workflows: IWorkflow[];
    selectedWorkflowConfig: IWorkflowConfig | null;
    onClose: () => void;
    onConfirm: (config: IWorkflowConfig) => void;
}
