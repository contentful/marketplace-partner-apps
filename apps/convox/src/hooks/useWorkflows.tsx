import { useState, useEffect } from 'react';
import ConvoxClient from '../client/ConvoxClient';
import { IWorkflow } from '../customTypes/IWorkflow';
import { API_ERRORS } from '../constants';

const useFetchWorkflows = (convoxDeployKey: string | "") => {
    const [workflows, setWorkflows] = useState<IWorkflow[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [hasAuthError, setHasAuthError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const convoxClient = new ConvoxClient();

    useEffect(() => {
        async function fetchWorkflows() {
            if (!convoxDeployKey) {
                setWorkflows([]);
                setIsAuthenticated(false);
                setHasAuthError(false);
                return;
            }

            setIsLoading(true);

            try {
                const response = await convoxClient.fetchWorkflows(convoxDeployKey);
                const filteredWorkflows = response.workflows.filter(workflow => workflow.kind === 'deployment').map(workflow => ({
                    id: workflow.id,
                    name: workflow.name,
                    kind: workflow.kind,
                }))
                setWorkflows(filteredWorkflows);
                setIsAuthenticated(true);
                setHasAuthError(false);
            } catch (error) {
                setWorkflows([]);
                if (error && typeof error === 'object' && 'type' in error && error.type === API_ERRORS.ERROR_UNAUTHORIZED) {
                    setIsAuthenticated(false);
                    setHasAuthError(true);
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchWorkflows();
    }, [convoxDeployKey]);

    async function runWorkflow(workflowId: string) {
        let job = null;
        if (!convoxDeployKey) {
            setHasAuthError(true);
            setIsAuthenticated(false);
            return null;
        }

        setIsLoading(true);

        try {
            job = await convoxClient.runWorkflow(convoxDeployKey, workflowId);
            setIsAuthenticated(true);
            setHasAuthError(false);
        } catch (error) {
            if (error && typeof error === 'object' && 'type' in error && error.type === API_ERRORS.ERROR_UNAUTHORIZED) {
                setIsAuthenticated(false);
                setHasAuthError(true);
            }
        } finally {
            setIsLoading(false);
        }
        return job;
    }

    return {
        workflows,
        isAuthenticated,
        hasAuthError,
        isLoading,
        runWorkflow,
    };
};

export default useFetchWorkflows;
