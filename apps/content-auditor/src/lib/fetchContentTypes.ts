export const fetchContentTypes = async (
    spaceId: string,
    environmentId: string,
    accessToken: string
  ) => {
    const res = await fetch(
      `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/content_types`,
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
  