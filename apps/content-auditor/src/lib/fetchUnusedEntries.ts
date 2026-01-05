import { createClient } from "contentful-management";

export const fetchUnusedEntries = async (
  accessToken: string,
  spaceId: string,
  environmentId: string,
  selectedContentType: string
) => {
  const client = createClient({ accessToken });
  const space = await client.getSpace(spaceId);
  const env = await space.getEnvironment(environmentId);

  // Step 1: Get all entries in the environment to collect referenced entry IDs
  const allEntries = await env.getEntries({ limit: 1000 });
  const referencedIds = new Set<string>();

  for (const entry of allEntries.items) {
    const fields = entry.fields;

    for (const fieldName in fields) {
      const fieldLocales = fields[fieldName];

      for (const locale in fieldLocales) {
        const value = fieldLocales[locale];

        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item?.sys?.type === "Link" && item.sys.linkType === "Entry") {
              referencedIds.add(item.sys.id);
            }
          });
        } else if (
          value?.sys?.type === "Link" &&
          value.sys.linkType === "Entry"
        ) {
          referencedIds.add(value.sys.id);
        }
      }
    }
  }

  // Step 2: Fetch entries of the selected content type
  const selectedTypeEntries = await env.getEntries({
    content_type: selectedContentType,
    limit: 1000,
  });

  // Step 3: Return only those that are NOT referenced
  return selectedTypeEntries.items.filter(
    (entry) => !referencedIds.has(entry.sys.id)
  );
};
