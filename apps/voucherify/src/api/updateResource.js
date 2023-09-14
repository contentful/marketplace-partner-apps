import axios from 'axios';
const contentfulBackendUrl = 'backend/contentful';

export const linkEntryToResource = async ({ resourceId, entryId, contentType, appId, secretKey, customURL, resourceType }) => {
  try {
    const body = { entryId, contentType };
    return await axios.post(`${customURL}/${contentfulBackendUrl}/${resourceType}/${resourceId}/entry`, body, {
      headers: {
        'application-id': `${appId}`,
        'secret-key': `${secretKey}`,
      },
    });
  } catch (error) {
    throw new Error(`(Status: ${error.response.statusText}) Error while trying to link entry: ${entryId} to ${resourceType}: ${resourceId}.`);
  }
};

export const unlinkEntryFromResource = async ({ resourceId, entryId, appId, secretKey, customURL, resourceType }) => {
  try {
    return await axios.delete(`${customURL}/${contentfulBackendUrl}/${resourceType}/${resourceId}/entry/${entryId}`, {
      headers: {
        'application-id': `${appId}`,
        'secret-key': `${secretKey}`,
      },
    });
  } catch (error) {
    throw new Error(`(Status: ${error.response.statusText}) Error while trying to unlink entry: ${entryId} from ${resourceType}: ${resourceId}.`);
  }
};
