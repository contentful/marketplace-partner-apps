import { SidebarAppSDK } from '@contentful/app-sdk';
import { Select, Option, Button } from '@contentful/f36-components';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';
import { useEffect, useState } from 'react';
import { IWorkflowConfig } from '../customTypes/IWorkflowConfig';
import useFetchWorkflows from '../hooks/useWorkflows';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const [workflowConfigs, setWorkflowConfigs] = useState<IWorkflowConfig[]>([]);
  const [workflowConfig, setWorkflowConfig] = useState<IWorkflowConfig>();
  const [convoxDeployKey, setConvoxDeployKey] = useState("");
  const { isAuthenticated, isLoading, runWorkflow } = useFetchWorkflows(convoxDeployKey);


  useEffect(() => {
    const app = sdk.parameters.installation;
    if (app) {
      setConvoxDeployKey(sdk.parameters.installation.convoxDeployKey);
      setWorkflowConfigs(sdk.parameters.installation.workflowConfigs);

      setWorkflowConfig(sdk.parameters.installation.workflowConfigs[0]);
    }
  }, []);


  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  function workflowConfigChangedHandler(id: string) {
    if (isLoading) {
      return;
    }
    const found = workflowConfigs.find(workflowConfig => workflowConfig.workflow.id === id);
    if (found) {
      setWorkflowConfig(found);
    }
  }

  async function runWorkflowHandler() {
    if (!workflowConfig || !isAuthenticated) {
      return;
    }
    const job = await runWorkflow(workflowConfig.workflow.id);
    if (job) {
      sdk.notifier.success(`Workflow ${workflowConfig.displayName} started running.`);
    } else {
      sdk.notifier.error(`Workflow ${workflowConfig.displayName} failed to run.`);
    }
  }

  return (
    <>
      <Select onChange={(e) => workflowConfigChangedHandler(e.target.value)} value={workflowConfig?.workflow.id} isDisabled={!isAuthenticated}>
        {workflowConfigs.map(({ workflow, displayName }) => {
          return (
            <Option key={workflow.id} value={workflow.id}>
              {displayName}
            </Option>
          );
        })}
      </Select>
      <div className={styles.actionContainer}>
        <Button
          variant='primary'
          isLoading={isLoading}
          isFullWidth
          isDisabled={!isAuthenticated || isLoading}
          onClick={runWorkflowHandler}>
          Run Workflow
        </Button>
      </div>
      {!isAuthenticated && <p className={styles.authenticationError}>Your Convox deploy key is expired/removed.</p>}
    </>

  )
};

export default Sidebar;


const styles = {
  actionContainer: css({
    marginTop: tokens.spacingM,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '8px',
  }),
  authenticationError: css({
    fontSize: tokens.fontSizeS,
    textAlign: 'center',
    marginTop: tokens.spacingXs,
    color: tokens.red400
  })
};
