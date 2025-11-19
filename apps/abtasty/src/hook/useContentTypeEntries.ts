import { useQuery } from '@tanstack/react-query';
import { EditorAppSDK } from '@contentful/app-sdk';

type EntryType = {
  id: string;
  name: string;
};

export const useContentTypeEntries = (sdk: EditorAppSDK, contentTypeId?: string | null): EntryType[] => {
  const { data: entries = [] } = useQuery({
    queryKey: ['contentTypes', sdk.ids.space, sdk.ids.environment, contentTypeId],
    queryFn: async () => {
      if (!contentTypeId) return [] as EntryType[];
      try {
        const ct = await sdk.cma.contentType.get({ contentTypeId });
        return [{ id: ct.sys.id, name: ct.name as string }] as EntryType[];
      } catch {
        const contentTypes = await sdk.cma.contentType.getMany({});
        return contentTypes.items
          .filter((e) => e.sys.id === contentTypeId)
          .map((e) => ({ id: e.sys.id, name: e.name as string })) as EntryType[];
      }
    },
  });
  return entries;
};
