import { fetchUnusedEntries } from "./fetchUnusedEntries";

export const generateReport = async (
  accessToken: string,
  spaceId: string,
  environmentId: string,
  setUnusedEntries: React.Dispatch<React.SetStateAction<any[]>>,
  setHasGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  selectedContentType: string
) => {
  try {
    const unused = await fetchUnusedEntries(
      accessToken,
      spaceId,
      environmentId,
      selectedContentType
    );
    setUnusedEntries(unused);
  } catch (error) {
    console.error("Error generating report:", error);
  }

  setHasGenerated(true);
};
