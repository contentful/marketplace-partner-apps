import { Asset, Entry } from 'contentful-management';

type SetAssetsFn = (assets: Asset[]) => void;
type SetFlagFn = (generated: boolean) => void;

export const generateMediaReport = async (
  accessToken: string,
  spaceId: string,
  environmentId: string,
  setUnusedAssets: SetAssetsFn,
  setHasGenerated: SetFlagFn
): Promise<void> => {
  try {
    const allAssets = await fetchAllAssets(accessToken, spaceId, environmentId);
    const allEntries = await fetchAllEntries(accessToken, spaceId, environmentId);

    const usedAssetIds = new Set<string>();
    allEntries.forEach((entry) => extractLinkedAssetIds(entry.fields as Entry['fields'], usedAssetIds));

    const unusedAssets = allAssets.filter(asset => !usedAssetIds.has(asset.sys.id));
    setUnusedAssets(unusedAssets);
  } catch (error) {
    console.error("Error generating media report:", error);
    setUnusedAssets([]);
  } finally {
    setHasGenerated(true);
  }
};

const fetchAllAssets = async (
  accessToken: string,
  spaceId: string,
  environmentId: string
): Promise<Asset[]> => {
  const response = await fetch(
    `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/assets?limit=1000`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();
  return data.items as Asset[];
};

const fetchAllEntries = async (
  accessToken: string,
  spaceId: string,
  environmentId: string
): Promise<Entry[]> => {
  const limit = 1000;
  let skip = 0;
  const entries: Entry[] = [];

  while (true) {
    const res = await fetch(
      `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries?skip=${skip}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await res.json();
    entries.push(...(data.items as Entry[]));

    if (data.items.length < limit) break;
    skip += limit;
  }

  return entries;
};

const extractLinkedAssetIds = (
  fields: Entry['fields'],
  idSet: Set<string>
): void => {
  for (const fieldKey of Object.keys(fields)) {
    const fieldVal = fields[fieldKey];
    if (!fieldVal) continue;

    for (const localeKey of Object.keys(fieldVal)) {
      const val = fieldVal[localeKey];
      if (val?.sys?.linkType === "Asset") {
        idSet.add(val.sys.id);
      } else if (Array.isArray(val)) {
        val.forEach((item) => {
          if (item?.sys?.linkType === "Asset") {
            idSet.add(item.sys.id);
          }
        });
      }
    }
  }
};
