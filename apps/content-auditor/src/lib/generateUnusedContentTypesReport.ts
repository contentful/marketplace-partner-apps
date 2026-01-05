import { createClient } from 'contentful-management';

const fetchAllEntries = async (environment: any): Promise<any[]> => {
  let skip = 0;
  const limit = 1000;
  let allEntries: any[] = [];

  while (true) {
    const response = await environment.getEntries({ skip, limit });
    allEntries.push(...response.items);

    if (response.items.length < limit) break;
    skip += limit;
  }

  return allEntries;
};

export const generateUnusedContentTypesReport = async (
  accessToken: string,
  spaceId: string,
  environmentId: string
): Promise<any[]> => {
  const client = createClient({ accessToken });
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);

  const [contentTypes, allEntries] = await Promise.all([
    environment.getContentTypes(),
    fetchAllEntries(environment),
  ]);

  const usedContentTypeIds = new Set(
    allEntries.map((entry: any) => entry.sys.contentType.sys.id)
  );

  const unusedContentTypes = contentTypes.items.filter(
    (ct) => !usedContentTypeIds.has(ct.sys.id)
  );

  console.log('Unused Content Types:', unusedContentTypes);
  return unusedContentTypes;
};
