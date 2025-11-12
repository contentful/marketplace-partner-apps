export const deleteAssets = async (
  assetIds: string[],
  accessToken: string,
  spaceId: string,
  environmentId: string,
  onComplete: () => void
) => {
  for (const assetId of assetIds) {
    try {
      const assetRes = await fetch(
        `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/assets/${assetId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!assetRes.ok) continue;

      const assetData = await assetRes.json();
      const isPublished = !!assetData.sys.publishedVersion;

      if (isPublished) {
        const unpublishRes = await fetch(
          `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/assets/${assetId}/published`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!unpublishRes.ok && unpublishRes.status !== 404) continue;
      }

      await fetch(
        `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/assets/${assetId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch {
    }
  }

  onComplete();
};
