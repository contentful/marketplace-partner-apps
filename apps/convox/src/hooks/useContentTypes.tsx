import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { useCallback, useEffect, useState, useMemo } from 'react';

const CONTENT_TYPES_FETCH_LIMIT = 100;

export const useContentTypes = () => {
  const [allContentTypes, setAllContentTypes] = useState<ContentTypeProps[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const sdk = useSDK<ConfigAppSDK>();

  const getAllContentTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const contentTypesSuperset: ContentTypeProps[] = [];
      let skip = 0;
      let totalFetched = 0;
      // eslint-disable-next-line
      while (true) {
        const contentTypesResponse = await sdk.cma.contentType.getMany({
          query: {
            limit: CONTENT_TYPES_FETCH_LIMIT,
            skip,
            order: 'name',
          },
        });

        const { items, total } = contentTypesResponse;
        contentTypesSuperset.push(...items);
        totalFetched += items.length;

        // if all content types are fetched stop from looping
        if (totalFetched >= total) {
          break;
        }

        skip += CONTENT_TYPES_FETCH_LIMIT;
      }

      setAllContentTypes(contentTypesSuperset);
    } catch (err) {
      const error = new Error('Unable to fetch content types');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [sdk.cma.contentType]);

  useEffect(() => {
    getAllContentTypes();
  }, [getAllContentTypes]);

  // useMemo to prevent unnecessary re-renders
  return useMemo(
    () => ({ contentTypes: allContentTypes, loading, error }),
    [allContentTypes, loading, error]
  );
}
