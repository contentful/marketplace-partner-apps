export const deleteAssets = async (
    assetIds: string[],
    accessToken: string,
    spaceId: string,
    environmentId: string,
    onComplete: () => void
  ) => {
    for (const assetId of assetIds) {
      try {
        // First unpublish the asset
        await fetch(
          `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/assets/${assetId}/published`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
  
        // Then delete the asset
        await fetch(
          `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/assets/${assetId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      } catch (err) {
        console.error(`Failed to delete asset ${assetId}`, err);
      }
    }
  
    onComplete();
  };
  