import { WorkflowSteps } from './workflow-steps';

export const NEW_CONFIG_FORM_ID = 'newConfig';

export const LILT_API_URL = 'https://lilt.com/2';

export const DIALOG_TYPES = {
  SEND_FOR_LOCALIZATION: 'send_for_localization',
  SEND_MULTIPLE_FOR_LOCALIZATION: 'send_multiple_for_localization',
  ENTRY_SELECTOR: 'entry_selector',
  LILT_CREATE: 'lilt_create'
};

/**
 * If the user changes the source content while
 * in one of the following statuses, they will not be warned.
 * They also have the ability to select the target locales
 * while in one of those states
 */
export const PRE_SUBMISSION_STATUSES = [
  WorkflowSteps.INITIAL,
  WorkflowSteps.UNPUBLISHED,
  WorkflowSteps.NEEDS_LOCALIZATION
];
