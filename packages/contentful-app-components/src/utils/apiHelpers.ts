import type { ConfigAppSDK } from '@contentful/app-sdk';
import type { ContentTypeProps } from 'contentful-management';

const DEFAULT_RETRY_DELAY = 500;
const MAX_RETRIES = 3;
const BATCH_DELAY = 200; // Delay between batches to avoid rate limits
const DEFAULT_BATCH_SIZE = 10; // Process editor interfaces in batches of 10

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const retryWithBackoff = async <T>(fn: () => Promise<T>, retries: number = MAX_RETRIES, delay: number = DEFAULT_RETRY_DELAY): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error?.message?.includes('rate limit') || error?.message?.includes('429'))) {
      console.warn(`Rate limit hit, retrying in ${delay}ms... (${retries} retries left)`);
      await sleep(delay);
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs))]);
};

export const processInBatches = async <T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
  delayBetweenBatches: number = BATCH_DELAY
): Promise<R[]> => {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);

    // Add delay between batches to avoid rate limits
    if (i + batchSize < items.length) {
      await sleep(delayBetweenBatches);
    }
  }

  return results;
};

export const fetchAllContentTypes = async (cma: any, onProgress?: (processed: number, total: number) => void): Promise<ContentTypeProps[]> => {
  const allContentTypes: ContentTypeProps[] = [];
  let skip = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const response = (await retryWithBackoff(() => cma.contentType.getMany({ query: { limit, skip } }))) as any;

    allContentTypes.push(...response.items);

    if (onProgress) {
      onProgress(allContentTypes.length, response.total);
    }

    hasMore = response.items.length === limit && allContentTypes.length < response.total;
    skip += limit;
  }

  return allContentTypes;
};

export const fetchEditorInterfacesForContentTypes = async (
  cma: any,
  contentTypes: ContentTypeProps[],
  onProgress?: (processed: number, total: number) => void
): Promise<Array<{ contentTypeId: string; editorInterface: any }>> => {
  const results: Array<{ contentTypeId: string; editorInterface: any }> = [];

  await processInBatches(
    contentTypes,
    DEFAULT_BATCH_SIZE, // Process 10 at a time to avoid rate limits
    async (batch) => {
      const batchResults = await Promise.allSettled(
        batch.map(async (contentType) => {
          try {
            const editorInterface = await retryWithBackoff(() => cma.editorInterface.get({ contentTypeId: contentType.sys.id }));
            return {
              contentTypeId: contentType.sys.id,
              editorInterface,
            };
          } catch (error) {
            console.warn(`Failed to fetch editor interface for ${contentType.name}:`, error);
            return {
              contentTypeId: contentType.sys.id,
              editorInterface: { controls: [] },
            };
          }
        })
      );

      const successfulResults = batchResults
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map((result) => result.value);

      results.push(...successfulResults);

      if (onProgress) {
        onProgress(results.length, contentTypes.length);
      }

      return successfulResults;
    }
  );

  return results;
};
