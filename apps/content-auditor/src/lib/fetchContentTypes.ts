export const fetchContentTypes = async (
    spaceId: string,
    environmentId: string,
    accessToken: string,
    cmaHostname: string
  ) => {
    const res = await fetch(
      `https://${cmaHostname}/spaces/${spaceId}/environments/${environmentId}/content_types`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
  
    if (!res.ok) throw new Error("Failed to fetch content types");
    return res.json();
  };
  