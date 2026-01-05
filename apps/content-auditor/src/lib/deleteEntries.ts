// lib/deleteEntries.ts
import { createClient } from "contentful-management";

export const deleteEntries = async (
  entryIds: string[],
  accessToken: string,
  spaceId: string,
  environmentId: string,
  generateReport: () => void
) => {
  try {
    const client = createClient({ accessToken });
    const space = await client.getSpace(spaceId);
    const env = await space.getEnvironment(environmentId);

    for (const entryId of entryIds) {
      const entry = await env.getEntry(entryId);

      if (entry.sys.publishedVersion) {
        await entry.unpublish();
        console.log(`Unpublished entry with ID: ${entryId}`);
      }

      await entry.delete();
      console.log(`Deleted entry with ID: ${entryId}`);
    }

    generateReport();
  } catch (error) {
    console.error("Error deleting entries:", error);
  }
};
