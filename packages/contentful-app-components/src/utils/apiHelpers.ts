import type { ConfigAppSDK } from '@contentful/app-sdk';

const DEFAULT_RETRY_DELAY = 500;
const MAX_RETRIES = 3;
const BATCH_DELAY = 200;

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
