import { PlainClientAPI } from 'contentful-management';
import { BatchOptions, RetryOptions, ProgressOptions } from '../components/ContentTypeSelector/types';

/**
 * Sleep utility function
 */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Process content types in batches to avoid rate limits
 */
export async function processContentTypesInBatches<T>(
  cma: PlainClientAPI,
  processor: (contentType: any) => Promise<T>,
  options: BatchOptions = {}
): Promise<T[]> {
  const { batchSize = 10, delay = 1000, maxRetries = 3, baseDelay = 500 } = options;

  try {
    // Fetch all content types
    const contentTypesResponse = await cma.contentType.getMany({
      query: { limit: 1000 },
    });

    const contentTypes = contentTypesResponse.items;
    const results: T[] = [];

    // Process in batches
    for (let i = 0; i < contentTypes.length; i += batchSize) {
      const batch = contentTypes.slice(i, i + batchSize);

      const batchPromises = batch.map(async (contentType: any) => {
        return await withRetry(() => processor(contentType), { maxRetries, baseDelay });
      });

      const batchResults = await Promise.allSettled(batchPromises);

      // Collect successful results
      batchResults.forEach((result: any) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });

      // Add delay between batches to avoid rate limits
      if (i + batchSize < contentTypes.length) {
        await sleep(delay);
      }
    }

    return results;
  } catch (error) {
    console.error('Error processing content types in batches:', error);
    throw error;
  }
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 30000, backoffMultiplier = 2 } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable (rate limit, network error, etc.)
      const isRetryable = isRetryableError(error);
      if (!isRetryable) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt), maxDelay);

      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms... (${maxRetries - attempt} retries left)`);

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any): boolean {
  const retryableMessages = ['rate limit', '429', 'too many requests', 'network', 'timeout', 'connection', 'server error', '500', '502', '503', '504'];

  const errorMessage = error?.message?.toLowerCase() || '';
  return retryableMessages.some((msg) => errorMessage.includes(msg));
}

/**
 * Process items with progress tracking
 */
export async function withProgress<T, R>(items: T[], processor: (item: T, index: number) => Promise<R>, options: ProgressOptions = {}): Promise<R[]> {
  const { onProgress, batchSize = 10 } = options;
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchPromises = batch.map(async (item, batchIndex) => {
      const index = i + batchIndex;
      return await processor(item, index);
    });

    const batchResults = await Promise.allSettled(batchPromises);

    // Collect successful results
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    });

    // Report progress
    if (onProgress) {
      const processed = Math.min(i + batchSize, items.length);
      onProgress(processed, items.length);
    }
  }

  return results;
}

/**
 * Fetch content types with pagination
 */
export async function fetchContentTypes(
  cma: PlainClientAPI,
  options: {
    limit?: number;
    skip?: number;
    order?: string;
    filters?: any[];
  } = {}
): Promise<{ items: any[]; total: number }> {
  const { limit = 1000, skip = 0, order = 'name' } = options;

  try {
    const response = await cma.contentType.getMany({
      query: {
        limit,
        skip,
        order,
      },
    });

    return {
      items: response.items,
      total: response.total,
    };
  } catch (error) {
    console.error('Error fetching content types:', error);
    throw error;
  }
}

/**
 * Fetch editor interfaces for content types
 */
export async function fetchEditorInterfaces(cma: PlainClientAPI, contentTypeIds: string[], options: BatchOptions = {}): Promise<Record<string, any>> {
  const { batchSize = 10, delay = 1000, maxRetries = 3, baseDelay = 500 } = options;
  const editorInterfaces: Record<string, any> = {};

  // Process in batches
  for (let i = 0; i < contentTypeIds.length; i += batchSize) {
    const batch = contentTypeIds.slice(i, i + batchSize);

    const batchPromises = batch.map(async (contentTypeId) => {
      try {
        const editorInterface = await withRetry(() => cma.editorInterface.get({ contentTypeId }), { maxRetries, baseDelay });
        return { contentTypeId, editorInterface };
      } catch (error) {
        console.warn(`Failed to fetch editor interface for ${contentTypeId}:`, error);
        return { contentTypeId, editorInterface: null };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);

    // Collect successful results
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.editorInterface) {
        editorInterfaces[result.value.contentTypeId] = result.value.editorInterface;
      }
    });

    // Add delay between batches to avoid rate limits
    if (i + batchSize < contentTypeIds.length) {
      await sleep(delay);
    }
  }

  return editorInterfaces;
}

/**
 * Update editor interfaces in batches
 */
export async function updateEditorInterfaces(
  cma: PlainClientAPI,
  updates: Array<{ contentTypeId: string; editorInterface: any }>,
  options: BatchOptions = {}
): Promise<Array<{ contentTypeId: string; success: boolean; error?: string }>> {
  const { batchSize = 5, delay = 1000, maxRetries = 3, baseDelay = 500 } = options;
  const results: Array<{ contentTypeId: string; success: boolean; error?: string }> = [];

  // Process in batches
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    const batchPromises = batch.map(async ({ contentTypeId, editorInterface }) => {
      try {
        await withRetry(() => cma.editorInterface.update({ contentTypeId }, editorInterface), { maxRetries, baseDelay });
        return { contentTypeId, success: true };
      } catch (error: any) {
        console.warn(`Failed to update editor interface for ${contentTypeId}:`, error);
        return {
          contentTypeId,
          success: false,
          error: error?.message || 'Unknown error',
        };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);

    // Collect results
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          contentTypeId: 'unknown',
          success: false,
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    // Add delay between batches to avoid rate limits
    if (i + batchSize < updates.length) {
      await sleep(delay);
    }
  }

  return results;
}
