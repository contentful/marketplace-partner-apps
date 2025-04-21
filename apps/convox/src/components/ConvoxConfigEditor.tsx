import { Button, Flex, Heading, Subheading, Text, TextLink } from "@contentful/f36-components"
import { PlusIcon } from "@contentful/f36-icons";
import tokens from "@contentful/f36-tokens";
import { css } from "@emotion/css";
import { useState } from "react";
import SiteConfigModal from "./SiteConfigModal";
import { IWorkflowConfig } from "../customTypes/IWorkflowConfig";
import { IConvoxConfigEditorProps } from "../customTypes/IConvoxConfigEditorProps";

const styles = {
    container: css({
        margin: `${tokens.spacingXl} 0`,
    }),
    row: css({
        display: 'flex',
        marginBottom: tokens.spacingM,
        paddingBottom: tokens.spacingM,
        borderBottom: `1px solid ${tokens.gray200}`,
        alignItems: 'center',
        '&:last-child': css({
            marginBottom: tokens.spacingL,
            paddingBottom: 0,
            borderBottom: 0,
        }),
    }),
    workflows: css({
        marginTop: tokens.spacingM
    }),
    workflow: css({
        flexGrow: 1,
    }),
}

export default function ConvoxConfigEditor({ workflowConfigs, isAuthenticated, workflows, updateWorkflowConfigs, removeWorkflowConfigs }: IConvoxConfigEditorProps) {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedWorkflowConfig, setSelectedWorkflowConfig] = useState<IWorkflowConfig | null>(null);
    const [selectedWorkflowConfigIndex, setSelectedWorkflowConfigIndex] = useState(-1);

    function onAddWorkflowConfigHandler() {
        setSelectedWorkflowConfig(null);
        setSelectedWorkflowConfigIndex(-1);
        setIsModalVisible(true);
    }
    function onConfirmModalHandler(config: IWorkflowConfig) {
        setIsModalVisible(false);
        updateWorkflowConfigs(config, selectedWorkflowConfigIndex);
        setSelectedWorkflowConfig(null);
        setSelectedWorkflowConfigIndex(-1);
    }
    function onCloseModalHandler() {
        setIsModalVisible(false);
    }
    function onEditWorkfConfigHandler(index: number) {
            setSelectedWorkflowConfig(workflowConfigs[index]);
            setSelectedWorkflowConfigIndex(index);
            setIsModalVisible(true);
    }

    return (
        <>
            <div className={styles.container}>
                <Heading>Configure Convox Workflows</Heading>
                <Flex alignItems="center">
                    <Button
                        isDisabled={!isAuthenticated}
                        variant="primary"
                        startIcon={<PlusIcon />}
                        size="small"
                        onClick={onAddWorkflowConfigHandler}>
                        Add workflows
                    </Button>
                </Flex>
                <div className={styles.workflows}>
                    {workflowConfigs.map(({ workflow, displayName }, index) => (
                        <div key={workflow.id} className={styles.row}>
                            <div className={styles.workflow}>
                                <Subheading marginBottom="none">{displayName}</Subheading>
                                <Text fontColor="gray600">{workflow.name}</Text>
                            </div>
                            <TextLink
                                style={{ marginRight: tokens.spacingM }}
                                variant="primary"
                                isDisabled={!isAuthenticated}
                                onClick={() => onEditWorkfConfigHandler(index)}
                            >
                                Edit
                            </TextLink>
                            <TextLink
                                variant="negative"
                                isDisabled={!isAuthenticated}
                                onClick={() => removeWorkflowConfigs(workflow.id)}>
                                Remove
                            </TextLink>
                        </div>
                    ))}
                </div>
            </div>
            <SiteConfigModal
                isShown={isModalVisible}
                workflows={workflows}
                selectedWorkflowConfig={selectedWorkflowConfig}
                workflowConfigs={workflowConfigs}
                onConfirm={onConfirmModalHandler}
                onClose={onCloseModalHandler} />
        </>
    )
}
