import { info, UploadClientError } from '@uploadcare/upload-client';
import { ContentFields, ContentTypeProps, EditorInterfaceProps } from 'contentful-management';
import { objectKeys } from 'ts-extras';
import { AppInstallationParameters } from '../../types';

export type CompatibleFields = Record<string, ContentFields[]>;
export type SelectedFields = Record<string, string[]>;
export type AppInstallationParametersValidationErrors = Record<keyof AppInstallationParameters, string>;

export function getCompatibleFields(contentTypes: ContentTypeProps[]): CompatibleFields {
  // currently "compatible" means "json objects only"
  return contentTypes.reduce((acc, ct) => {
    return {
      ...acc,
      [ct.sys.id]: (ct.fields || []).filter(field => field.type === 'Object'),
    };
  }, {});
}

export function editorInterfacesToSelectedFields(eis: EditorInterfaceProps[], appId?: string): SelectedFields {
  return eis.reduce(
    (acc, ei) => {
      const ctId = ei?.sys?.contentType?.sys?.id;

      if (!ctId) {
        return acc;
      }

      const fieldIds = (ei?.controls ?? [])
        .filter(control => control.widgetNamespace === 'app' && control.widgetId === appId)
        .map(control => control.fieldId)
        // probably do not need those checks, but folks from Contentful used them:
        // https://github.com/contentful/marketplace-partner-apps/blob/main/apps/cloudinary2/src/locations/ConfigScreen/fields.ts#L21
        // so leaving 'em here just in case
        .filter(fieldId => typeof fieldId === 'string' && fieldId.length > 0);

      if (fieldIds.length > 0) {
        acc[ctId] = fieldIds;
      }

      return acc;
    },
    {} as Record<string, string[]>,
  );
}

export function selectedFieldsToTargetState(contentTypes: ContentTypeProps[], selectedFields: SelectedFields) {
  return {
    EditorInterface: contentTypes.reduce((acc, ct) => {
      const { id } = ct.sys;
      const fields = selectedFields[id] || [];
      const targetState = fields.length > 0 ? { controls: fields.map(fieldId => ({ fieldId })) } : {};

      return { ...acc, [id]: targetState };
    }, {}),
  };
}

export function getEmptyParamsValidationErrorsObject(
  parameters: AppInstallationParameters,
): AppInstallationParametersValidationErrors {
  return objectKeys(parameters).reduce((acc, p) => {
    acc[p] = '';
    return acc;
  }, {} as AppInstallationParametersValidationErrors);
}
export async function validateParameters(
  parameters: AppInstallationParameters,
): Promise<AppInstallationParametersValidationErrors> {
  const validationErrors = getEmptyParamsValidationErrorsObject(parameters);

  if (!parameters.apiKey) {
    validationErrors.apiKey = 'Public API key is required.';
  } else if (await isPublicKeyInvalid(parameters.apiKey)) {
    validationErrors.apiKey = 'Public API key does not look valid.';
  }

  if (!(parameters.maxFiles >= 0)) {
    validationErrors.maxFiles = 'The number should be 0 or greater.';
  }

  if (Object.values(parameters.uploadSources).every(v => !v)) {
    validationErrors.uploadSources = 'Pick at least one upload source.';
  }

  if (parameters.customCname.length > 0) {
    try {
      new URL(parameters.customCname);
    } catch (err) {
      validationErrors.customCname =
        'Custom CNAME should be a valid URL starting with a scheme (usually, https). E.g.: https://ucarecdn.com.';
    }
  }

  return validationErrors;
}

// `false` here actually means "we do not know exactly"
async function isPublicKeyInvalid(publicKey: string): Promise<boolean> {
  try {
    await info('nothing here', {
      publicKey,
    });

    // should be impossible though
    return false;
  } catch (err) {
    if (err instanceof UploadClientError) {
      const apiError = err.response?.error;
      return apiError?.statusCode === 403 && apiError.errorCode === 'ProjectPublicKeyInvalidError';
    }

    return false;
  }
}
