import { useQuery } from '@tanstack/react-query';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';

export type ContentTypeOption = {
  id: string;
  name: string;
  items: ContentTypeOption[];
};

function hasReferenceFieldsLinkingToEntry(contentType: ContentTypeProps): boolean {
  return (
    Array.isArray(contentType.fields) &&
    contentType.fields.some((f: any) => {
      if (f.type === 'Link') return f.linkType === 'Entry';
      if (f.type === 'Array' && f.items?.type === 'Link') {
        return f.items.linkType === 'Entry';
      }
      return false;
    })
  );
}

export function useContentfulContentTypes(sdk: ConfigAppSDK, excludeContentTypeId?: string) {
  const query = useQuery({
    queryKey: ['contentTypes', sdk.ids.space, sdk.ids.environment],
    enabled: Boolean(sdk?.ids?.space && sdk?.ids?.environment),
    queryFn: async () => {
      const { items } = await sdk.cma.contentType.getMany({ query: { limit: 1000 } });
      return items
        .filter((contentType) => hasReferenceFieldsLinkingToEntry(contentType))
        .filter((contentType) => (excludeContentTypeId ? contentType.sys.id !== excludeContentTypeId : true))
        .map((contentType) => ({
          id: contentType.sys.id,
          name: contentType.name as string,
          items: contentType.fields.filter((f: any) => f.type === 'Array'),
        }))
        .toSorted((a, b) => a.name.localeCompare(b.name));
    },
  });

  return {
    contentTypes: query.data ?? [],
    loadingContentTypes: query.isLoading,
  };
}
