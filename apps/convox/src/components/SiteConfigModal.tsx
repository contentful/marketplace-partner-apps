import { Form, FormControl, Modal, Select, Option, Button, TextInput, ValidationMessage } from "@contentful/f36-components";
import { useEffect, useState } from "react";
import { IWorkflow } from "../customTypes/IWorkflow";
import { IWorkflowConfig } from "../customTypes/IWorkflowConfig";
import {CONVOX_APP_ERROR_MESSAGES} from "../constants";
import { ISiteConfigModalProps } from "../customTypes/ISiteConfigModalProps";


export default function SiteConfigModal({ isShown,workflowConfigs, workflows, selectedWorkflowConfig, onClose, onConfirm }: ISiteConfigModalProps) {

    const [workflow, setWorkflow] = useState<IWorkflow | null>(null);
    const [displayName, setDisplayName] = useState("");

    const [hasWorkflowError, setHasWorkflowError] = useState(false);
    const [hasDisplayNameError, setHasDisplayNameError] = useState(false);

    const workflowErrorMessage = CONVOX_APP_ERROR_MESSAGES.WORKFLOW_ERROR_MESSAGE;
    const displayNameErrorMessage = CONVOX_APP_ERROR_MESSAGES.DISPLAY_NAME_ERROR_MESSAGE;

    useEffect(() => {
        if (selectedWorkflowConfig) {
            setWorkflow(selectedWorkflowConfig.workflow);
            setDisplayName(selectedWorkflowConfig.displayName);
        } else {
            setWorkflow(null);
            setDisplayName("");
        }
    }, [selectedWorkflowConfig]);

    useEffect(() => {
        if (!isShown) {
            setHasWorkflowError(false);
            setHasDisplayNameError(false);
        }
    }, [isShown]);


    function onCancelHandler() {
        onClose();
        setWorkflow(null);
        setDisplayName("");
    }
    function onSubmitHandler() {
        if (!workflow) {
            setHasWorkflowError(true);
        } else {
            setHasWorkflowError(false);
        }
        if (!displayName) {
            setHasDisplayNameError(true);
        } else {
            setHasDisplayNameError(false);
        }

        if (!workflow || !displayName) {
            return;
        }

        const config: IWorkflowConfig = {
            displayName,
            workflow: workflow
        }
        onConfirm(config);
        setWorkflow(null);
        setDisplayName("");
    }


    function workflowChangedHandler(id: string) {
        const found = workflows.find(workflow => workflow.id === id);
        if (found) {
            setWorkflow(found);
        }
    }

    function renderWorkflowOptions(){
        const selectedWorkflowIds = workflowConfigs.map(config=> config.workflow.id);

        if(!selectedWorkflowConfig){
            return  workflows.filter(wf=> !selectedWorkflowIds.includes(wf.id)).map((workflow) => {
                return (
                    <Option key={workflow.id} value={workflow.id}>
                        {workflow.name}
                    </Option>
                );
            })
        }else{
            return  workflows.filter(wf=> !selectedWorkflowIds.includes(wf.id) || wf.id===selectedWorkflowConfig.workflow.id).map((workflow) => {
                return (
                    <Option key={workflow.id} value={workflow.id}>
                        {workflow.name}
                    </Option>
                );
            })
        }
        }
    


    return (
        <Modal
            isShown={isShown}
            onClose={onCancelHandler}
            size="medium"
        >
            <Modal.Header title="Configure Workflows" />
            <Modal.Content>
                <Form>
                <FormControl marginBottom="spacingM">
                        <FormControl.Label>Display Name</FormControl.Label>
                        <TextInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} isInvalid={!displayName && hasDisplayNameError} />
                        {!displayName && hasDisplayNameError && <ValidationMessage>{displayNameErrorMessage}</ValidationMessage>}
                    </FormControl>
                    <FormControl marginBottom="spacingM">
                        <FormControl.Label>Workflow</FormControl.Label>
                        <Select
                            value={workflow?.id}
                            onChange={(e) => workflowChangedHandler(e.target.value)}
                            isRequired={true}
                            isInvalid={!workflow && hasWorkflowError}
                            isDisabled={workflows.length === 0}
                        >
                            {!selectedWorkflowConfig && (
                                <Option value="">
                                    {workflows.length === 0
                                        ? 'No workflows available'
                                        : 'Select a Workflow'}
                                </Option>
                            )}
                            {renderWorkflowOptions()}
                        </Select>
                        {!workflow && hasWorkflowError && <ValidationMessage>{workflowErrorMessage}</ValidationMessage>}
                    </FormControl>
                </Form>
            </Modal.Content>
            <Modal.Controls>
                <Button variant="secondary" size="small" onClick={onCancelHandler}>
                    Cancel
                </Button>
                <Button
                    variant="positive"
                    size="small"
                    type="submit"
                    onClick={onSubmitHandler}>
                    Confirm
                </Button>
            </Modal.Controls>
        </Modal>
    )
}
