const API_ERRORS = {
    ERROR_UNAUTHORIZED: 'unauthorized',
    ERROR_NETWORK: 'network',
    ERROR_OTHER: 'other',
}

const CONVOX_APP_ERROR_MESSAGES = {
    AUTHENTICATION_DEPLOY_KEY_ERROR_MESSAGE: 'Must authenticate with a valid Convox deploy key',
    REQUIRED_WORKFLOWS_ERROR_MESSAGE: 'Must configure at least 1 workflow',
    WORKFLOW_ERROR_MESSAGE: "Please Select a Workflow",
    DISPLAY_NAME_ERROR_MESSAGE: "Please Select a Display Name",

}

export {API_ERRORS, CONVOX_APP_ERROR_MESSAGES}
