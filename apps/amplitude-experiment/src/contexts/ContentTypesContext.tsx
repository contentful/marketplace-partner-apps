import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { createContext, useEffect, useState } from 'react';
import { VARIANT_CONTAINER } from '../utils/shared';

interface ContentTypesContextProps {
  contentTypes: Array<ContentTypeProps>;
}

export const ContentTypesContext = createContext<ContentTypesContextProps>({
  contentTypes: [],
});

export const ContentTypesProvider = ({ children }: { children: React.ReactElement }) => {
  const sdk = useSDK();
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Enhanced query with environment-specific filtering and deduplication
        const response = await sdk.cma.contentType.getMany({
          query: {
            'sys.id[ne]': VARIANT_CONTAINER,
            'sys.publishedAt[exists]': true, // Only fetch published content types
            limit: 100,
          },
        });

        // Implement deduplication logic to remove duplicate content types
        const uniqueContentTypes = response.items.reduce((acc, item) => {
          const existing = acc.find((ct) => ct.sys.id === item.sys.id);
          if (!existing) {
            acc.push(item);
          }
          return acc;
        }, [] as ContentTypeProps[]);

        console.log(`Fetched ${response.items.length} content types, deduplicated to ${uniqueContentTypes.length}`);
        return uniqueContentTypes;
      } catch (error) {
        console.error('Error fetching content types:', error);
        return [];
      }
    };

    fetchData().then((contentTypes) => setContentTypes(contentTypes));
  }, [sdk.cma.contentType]);

  return <ContentTypesContext.Provider value={{ contentTypes }}>{children}</ContentTypesContext.Provider>;
};
