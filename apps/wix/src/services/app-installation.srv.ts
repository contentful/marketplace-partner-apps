export type ConnectedSite = {
  siteId: string;
  siteDisplayName: string;
  wixManageUrl: string;
  wixInstanceId: string;
};

export const getConnectedBusinesses = async ({
  environmentId,
  spaceId,
  contentfulAppId,
}: {
  environmentId: string;
  spaceId: string;
  contentfulAppId: string;
}): Promise<{ connectedBusinesses: ConnectedSite[] }> => {
  return fetch(
    `https://www.contentful-on-wix.com/_functions/appInstallationParams?environmentId=${environmentId}&spaceId=${spaceId}&appId=${contentfulAppId}`
  ).then((res) => res.json());
};

export const removeConnectedBusiness = async ({
  wixInstanceId,
  environmentId,
  spaceId,
  contentfulAppId,
}: {
  wixInstanceId: string;
  environmentId: string;
  spaceId: string;
  contentfulAppId: string;
}): Promise<{ success: boolean }> => {
  return fetch(
    `https://www.contentful-on-wix.com/_functions/removeConnection?environmentId=${environmentId}&spaceId=${spaceId}&appId=${contentfulAppId}&wixInstanceId=${wixInstanceId}`,
    {
      method: 'DELETE',
    }
  )
    .then(() => {
      return { success: true };
    })
    .catch((e) => {
      console.error('Failed to remove connection: ', e);
      return { success: false };
    });
};
