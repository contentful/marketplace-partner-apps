import { ConfigAppSDK } from '@contentful/app-sdk';
import type { ContentTypeProps } from 'contentful-management';

// Batch configuration for API requests - matching Lottie Preview
export const BATCH_SIZE = 10; // Process editor interfaces in batches of 10
export const RETRY_DELAY = 500; // Base delay for retries (ms)
export const MAX_RETRIES = 3; // More retries with better backoff
export const OVERALL_TIMEOUT = 120000; // 2 minute timeout for large content models
export const BATCH_DELAY = 200; // Delay between batches to avoid rate limits
export const INITIAL_BATCH_SIZE = 1000; // Load all content types on initial load

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to retry API calls with exponential backoff
export async function retryWithBackoff<T>(fn: () => Promise<T>, retries: number = MAX_RETRIES, delay: number = RETRY_DELAY): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error?.message?.includes('rate limit') || error?.message?.includes('429'))) {
      console.warn(`Rate limit hit, retrying in ${delay}ms... (${retries} retries left)`);
      await sleep(delay);
      return retryWithBackoff(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
}

// Add timeout wrapper for the entire operation
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs))]);
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Generic batch processing utility
export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
  onProgress?: (processed: number, total: number) => void,
  delayBetweenBatches: number = BATCH_DELAY
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchResults = await processor(batch);
    results.push(...batchResults);

    if (onProgress) {
      const processed = Math.min(i + batchSize, items.length);
      onProgress(processed, items.length);
    }

    // Add a delay between batches to avoid rate limits
    if (i + batchSize < items.length) {
      await sleep(delayBetweenBatches);
    }
  }

  return results;
}

// Generic content type fetching with progress
export async function fetchContentTypesWithProgress(cma: ConfigAppSDK['cma'], onProgress?: (processed: number, total: number) => void) {
  try {
    const contentTypes = await cma.contentType.getMany({
      query: { limit: 1000 },
    });

    if (onProgress) {
      onProgress(contentTypes.items.length, contentTypes.items.length);
    }

    return contentTypes.items;
  } catch (error) {
    console.error('Failed to fetch content types:', error);
    throw error;
  }
}

// Legacy function for backward compatibility
export async function fetchAllContentTypes(cma: ConfigAppSDK['cma'], onProgress?: (processed: number, total: number) => void): Promise<ContentTypeProps[]> {
  return fetchContentTypesWithProgress(cma, onProgress);
}

// Generic editor interface fetching with retry
export async function fetchEditorInterface(cma: ConfigAppSDK['cma'], contentTypeId: string) {
  return retryWithBackoff(() => cma.editorInterface.get({ contentTypeId }));
}

// Generic editor interface batch fetching
export async function fetchEditorInterfacesInBatches(
  cma: ConfigAppSDK['cma'],
  contentTypeIds: string[],
  onProgress?: (processed: number, total: number) => void
) {
  return processInBatches(
    contentTypeIds,
    BATCH_SIZE,
    async (batch) => {
      return Promise.allSettled(
        batch.map(async (contentTypeId) => {
          try {
            const editorInterface = await fetchEditorInterface(cma, contentTypeId);
            return { contentTypeId, editorInterface, success: true };
          } catch (error) {
            console.error(`Failed to fetch editor interface for ${contentTypeId}:`, error);
            return { contentTypeId, error, success: false };
          }
        })
      );
    },
    onProgress
  );
}
