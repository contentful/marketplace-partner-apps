import axios from 'axios';
const contentfulBackendUrl = 'backend/contentful';

export const fetchLinkedResources = async ({ entryId, page, appId, secretKey, customURL, searchQuery, resourceType }) => {
  return (
    await axios.get(`${customURL}/${contentfulBackendUrl}/${resourceType}/linked-resources`, {
      headers: {
        'application-id': `${appId}`,
        'secret-key': `${secretKey}`,
      },
      params: {
        entryId,
        page,
        searchQuery,
      },
    })
  ).data;
};

export const fetchUnlinkedResources = async ({ entryId, page, appId, secretKey, customURL, searchQuery, resourceType }) => {
  return (
    await axios.get(`${customURL}/${contentfulBackendUrl}/${resourceType}/unlinked-resources`, {
      headers: {
        'application-id': `${appId}`,
        'secret-key': `${secretKey}`,
      },
      params: {
        entryId,
        page,
        searchQuery,
      },
    })
  ).data;
};
