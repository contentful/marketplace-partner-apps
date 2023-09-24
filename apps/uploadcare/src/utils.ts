import { info, UploadClientError } from '@uploadcare/upload-client';
import { objectKeys } from 'ts-extras';
import { UPLOAD_SOURCES } from './constants';
import { InstallParams, InstallParamsValidationErrors, InstanceParams, InstanceParamsValidationErrors } from './types';

export function getEmptyInstallParamsValidationErrorsObject(params: InstallParams): InstallParamsValidationErrors {
  return objectKeys(params).reduce((acc, p) => {
    acc[p] = '';
    return acc;
  }, {} as InstallParamsValidationErrors);
}

function getEmptyInstanceParamsValidationErrorsObject(params: InstanceParams): InstanceParamsValidationErrors {
  return objectKeys(params).reduce((acc, p) => {
    acc[p] = '';
    return acc;
  }, {} as InstanceParamsValidationErrors);
}

export function validateInstanceParams(params: InstanceParams): InstanceParamsValidationErrors {
  const validationErrors = getEmptyInstanceParamsValidationErrorsObject(params);

  if (typeof params.maxFiles !== 'undefined' && !(params.maxFiles >= 0)) {
    validationErrors.maxFiles = 'Max number of files should be 0 or greater.';
  }

  if (params.uploadSourcesString) {
    const tokens = params.uploadSourcesString.split(',').map(t => t.trim());

    const emptyTokens = tokens.filter(t => !t);

    if (emptyTokens.length) {
      validationErrors.uploadSourcesString = 'Upload sources string contains empty tokens.';
    } else {
      const unknownTokens = tokens.filter(token => !UPLOAD_SOURCES.some(s => s.value === token));

      if (unknownTokens.length) {
        validationErrors.uploadSourcesString = `Upload sources string contains unknown tokens: ${unknownTokens.join(
          ', ',
        )}`;
      }
    }
  }

  return validationErrors;
}

export function validateInstallParams(params: InstallParams): InstallParamsValidationErrors {
  const validationErrors = getEmptyInstallParamsValidationErrorsObject(params);

  if (!params.apiKey) {
    validationErrors.apiKey = 'Public API key is required.';
  }

  if (!(params.maxFiles >= 0)) {
    validationErrors.maxFiles = 'Max number of files should be 0 or greater.';
  }

  if (Object.values(params.uploadSources).every(v => !v)) {
    validationErrors.uploadSources = 'Pick at least one upload source.';
  }

  if (params.customCname.length > 0) {
    try {
      new URL(params.customCname);
    } catch (err) {
      validationErrors.customCname =
        'Custom CNAME should be a valid URL starting with a scheme (usually, https). E.g.: https://ucarecdn.com.';
    }
  }

  return validationErrors;
}

// `false` here actually means "we do not know exactly"
export async function isPublicKeyInvalid(publicKey: string): Promise<boolean> {
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
