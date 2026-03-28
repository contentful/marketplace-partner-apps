import { useQuery } from '@tanstack/react-query';
import { EditorAppSDK } from '@contentful/app-sdk';

type EntryType = {
  id: string;
  name: string;
};

export const useContentTypeEntries = (sdk: EditorAppSDK, contentTypeIds?: string[]): EntryType[] => {
  const { data: entries = [] } = useQuery({
    queryKey: ['contentTypes', sdk.ids.space, sdk.ids.environment, contentTypeIds],
    queryFn: async () => {
      if (!contentTypeIds || contentTypeIds.length === 0) return [] as EntryType[];
      try {
        const results = await Promise.all(
          contentTypeIds.map(async (id) => {
            try {
              const ct = await sdk.cma.contentType.get({ contentTypeId: id });
              return { id: ct.sys.id, name: ct.name as string };
            } catch {
              return null;
            }
          })
        );
        return results.filter((r): r is EntryType => r !== null);
      } catch (err) {
        console.error(`Failed to get content type ${contentTypeIds}, trying getMany:`, err);
        try {
          const contentTypes = await sdk.cma.contentType.getMany({});
          return contentTypes.items
            .filter((e) => contentTypeIds.includes(e.sys.id))
            .map((e) => ({ id: e.sys.id, name: e.name as string })) as EntryType[];
        } catch (fallbackErr) {
          console.error('Failed to get content types:', fallbackErr);
          return [] as EntryType[];
        }
      }
    },
  });
  return entries;
};
