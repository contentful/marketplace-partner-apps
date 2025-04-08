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

const CONVOX_REFERENCE_URLS = {
    CONVOX_CONSOLE: 'https://console.convox.com',
    CONVOX_CONTENTFUL_DOCUMENTATION: 'https://docs.convox.com/integrations/headless-cms/contentful',
    CONVOX_ACADEMY: 'https://www.youtube.com/playlist?list=PL3w2iTa7QRGP48BP0NNgsLWCjMS9v-0go'
}

export {API_ERRORS, CONVOX_APP_ERROR_MESSAGES, CONVOX_REFERENCE_URLS}
