import { fetchUnusedEntries } from "./fetchUnusedEntries";

export const generateReport = async (
  accessToken: string,
  spaceId: string,
  environmentId: string,
  setUnusedEntries: React.Dispatch<React.SetStateAction<any[]>>,
  setHasGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  selectedContentType: string,
  cmaHostname: string
) => {
  try {
    const unused = await fetchUnusedEntries(
      accessToken,
      spaceId,
      environmentId,
      selectedContentType,
      cmaHostname
    );
    setUnusedEntries(unused);
  } catch (error) {
    console.error("Error generating report:", error);
  }

  setHasGenerated(true);
};
