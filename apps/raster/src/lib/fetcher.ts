import type { Fetcher, Library, Settings } from './types';

/**
 * Main fetcher for the library and images list.
 *
 * @param query GraphQL query
 * @param variables variables to pass to the query such as organizationId or libraryId
 * @param settings API keys and other settings
 * @returns Stringified JSON data
 */
export const fetcher = async (query: string, variables: Record<string, string>, settings: Settings) => {
  const body = {
    query,
    operationName: 'Query',
    variables,
  };

  const results = await fetch('https://api.raster.app', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: typeof settings.apiKey === 'string' ? `Bearer ${settings.apiKey}` : '',
      'Apollo-Require-Preflight': 'true',
    },

    body: JSON.stringify(body),
  });

  const data = await results.json();
  return data.data;
};

/**
 * SWR fetcher for the library list.
 * @param key
 * @returns return library list
 */
export const swrLibreriesFetcher = (key: Fetcher) =>
  fetcher(key.query, key.variables, key.settings).then((res) => {
    const libraryList = res.libraries.map((library: Library) => ({
      id: library.id,
      name: library.name,
      imagesCount: library.photosCount,
    }));

    return libraryList;
  });

/**
 * SWR fetcher for the image list.
 * @param key
 * @returns the list of images
 */
export const swrImagesFetcher = (key: Fetcher) => fetcher(key.query, key.variables, key.settings).then((res) => res.photos);
