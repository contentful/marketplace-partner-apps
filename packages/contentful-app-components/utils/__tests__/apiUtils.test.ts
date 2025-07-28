import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retryWithBackoff, withTimeout, debounce, processInBatches, BATCH_SIZE, RETRY_DELAY, MAX_RETRIES, OVERALL_TIMEOUT, BATCH_DELAY } from '../apiUtils';

// Mock timers
vi.useFakeTimers();

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result on successful first attempt', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');

    const result = await retryWithBackoff(mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on rate limit error and eventually succeed', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('rate limit exceeded'))
      .mockRejectedValueOnce(new Error('rate limit exceeded'))
      .mockRejectedValueOnce(new Error('rate limit exceeded'))
      .mockResolvedValue('success');

    const promise = retryWithBackoff(mockFn);

    // Advance through all retries
    await vi.advanceTimersByTimeAsync(500); // 1st retry
    await vi.advanceTimersByTimeAsync(1000); // 2nd retry
    await vi.advanceTimersByTimeAsync(2000); // 3rd retry

    const result = await promise;
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });

  it('should throw error after max retries', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('rate limit exceeded'));

    const promise = retryWithBackoff(mockFn);

    // Handle the promise rejection to prevent unhandled promise rejection
    const handlePromise = promise.catch(() => {});

    // Advance through all retries
    await vi.advanceTimersByTimeAsync(500); // 1st retry
    await vi.advanceTimersByTimeAsync(1000); // 2nd retry
    await vi.advanceTimersByTimeAsync(2000); // 3rd retry

    // Properly handle the rejected promise
    await expect(promise).rejects.toThrow('rate limit exceeded');

    // Ensure the catch handler is awaited
    await handlePromise;
  });

  it('should not retry on non-rate limit error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('network error'));

    await expect(retryWithBackoff(mockFn)).rejects.toThrow('network error');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should use custom retry count and delay', async () => {
    const mockFn = vi.fn().mockRejectedValueOnce(new Error('rate limit exceeded')).mockResolvedValue('success');

    const promise = retryWithBackoff(mockFn, 1, 1000);
    await vi.advanceTimersByTimeAsync(1000); // custom delay
    const result = await promise;
    expect(result).toBe('success');
  });

  it('should resolve immediately if no error', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');

    const result = await retryWithBackoff(mockFn);
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result when promise resolves before timeout', async () => {
    const mockPromise = Promise.resolve('success');

    const result = await withTimeout(mockPromise, 1000);

    expect(result).toBe('success');
  });

  it('should throw timeout error when promise takes too long', async () => {
    const mockPromise = new Promise((resolve) => {
      setTimeout(() => resolve('success'), 2000);
    });

    const promise = withTimeout(mockPromise, 1000);

    // Handle the promise rejection to prevent unhandled promise rejection
    const handlePromise = promise.catch(() => {});

    // Advance time to trigger timeout
    await vi.advanceTimersByTimeAsync(1000);

    // Properly handle the rejected promise
    await expect(promise).rejects.toThrow('Operation timed out after 1000ms');

    // Ensure the catch handler is awaited
    await handlePromise;
  });

  it('should throw original error when promise rejects', async () => {
    const mockPromise = Promise.reject(new Error('network error'));

    // Handle the promise rejection to prevent unhandled promise rejection
    mockPromise.catch(() => {});

    await expect(withTimeout(mockPromise, 1000)).rejects.toThrow('network error');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call function only once after delay', async () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1');
    debouncedFn('arg2');
    debouncedFn('arg3');

    expect(mockFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg3');
  });

  it('should reset timer on subsequent calls', async () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1');

    await vi.advanceTimersByTimeAsync(50);

    debouncedFn('arg2');

    await vi.advanceTimersByTimeAsync(50);

    expect(mockFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(50);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg2');
  });

  it('should handle multiple rapid calls', async () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    for (let i = 0; i < 10; i++) {
      debouncedFn(`arg${i}`);
    }

    expect(mockFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg9');
  });
});

describe('processInBatches', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should process items in batches', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const mockProcessor = vi.fn().mockImplementation(async (batch: number[]) => {
      return batch.map((item) => item * 2);
    });

    const result = await processInBatches(items, 3, mockProcessor, undefined, 0);

    expect(result).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
    expect(mockProcessor).toHaveBeenCalledTimes(4); // 3 items per batch = 4 batches
    expect(mockProcessor).toHaveBeenCalledWith([1, 2, 3]);
    expect(mockProcessor).toHaveBeenCalledWith([4, 5, 6]);
    expect(mockProcessor).toHaveBeenCalledWith([7, 8, 9]);
    expect(mockProcessor).toHaveBeenCalledWith([10]);
  }, 10000);

  it('should call onProgress callback', async () => {
    const items = [1, 2, 3, 4, 5];
    const mockProcessor = vi.fn().mockImplementation(async (batch: number[]) => {
      return batch.map((item) => item * 2);
    });
    const mockOnProgress = vi.fn();

    await processInBatches(items, 2, mockProcessor, mockOnProgress, 0);

    expect(mockOnProgress).toHaveBeenCalledTimes(3);
    expect(mockOnProgress).toHaveBeenCalledWith(2, 5); // First batch
    expect(mockOnProgress).toHaveBeenCalledWith(4, 5); // Second batch
    expect(mockOnProgress).toHaveBeenCalledWith(5, 5); // Third batch
  }, 10000);

  it('should handle empty items array', async () => {
    const mockProcessor = vi.fn();
    const mockOnProgress = vi.fn();

    const result = await processInBatches([], 3, mockProcessor, mockOnProgress);

    expect(result).toEqual([]);
    expect(mockProcessor).not.toHaveBeenCalled();
    expect(mockOnProgress).not.toHaveBeenCalled();
  });

  it('should handle batch size larger than items', async () => {
    const items = [1, 2, 3];
    const mockProcessor = vi.fn().mockImplementation(async (batch: number[]) => {
      return batch.map((item) => item * 2);
    });

    const result = await processInBatches(items, 10, mockProcessor);

    expect(result).toEqual([2, 4, 6]);
    expect(mockProcessor).toHaveBeenCalledTimes(1);
    expect(mockProcessor).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('should add delay between batches', async () => {
    const items = [1, 2, 3, 4];
    const mockProcessor = vi.fn().mockImplementation(async (batch: number[]) => {
      return batch.map((item) => item * 2);
    });
    const mockOnProgress = vi.fn();

    const startTime = Date.now();
    const promise = processInBatches(items, 2, mockProcessor, mockOnProgress, 100);

    // Wait for the promise to complete (which includes the delay)
    await promise;

    // Verify both batches were processed
    expect(mockProcessor).toHaveBeenCalledWith([1, 2]);
    expect(mockProcessor).toHaveBeenCalledWith([3, 4]);
    expect(mockProcessor).toHaveBeenCalledTimes(2);

    // Verify progress callbacks were called
    expect(mockOnProgress).toHaveBeenCalledWith(2, 4);
    expect(mockOnProgress).toHaveBeenCalledWith(4, 4);
    expect(mockOnProgress).toHaveBeenCalledTimes(2);

    // Verify that at least 100ms passed (indicating delay was applied)
    const endTime = Date.now();
    expect(endTime - startTime).toBeGreaterThanOrEqual(100);
  }, 10000);

  it('should handle processor errors', async () => {
    const items = [1, 2, 3];
    const mockProcessor = vi.fn().mockRejectedValue(new Error('processing error'));

    await expect(processInBatches(items, 2, mockProcessor)).rejects.toThrow('processing error');
  });
});

describe('Constants', () => {
  it('should export correct constants', () => {
    expect(BATCH_SIZE).toBe(10);
    expect(RETRY_DELAY).toBe(500);
    expect(MAX_RETRIES).toBe(3);
    expect(OVERALL_TIMEOUT).toBe(120000);
    expect(BATCH_DELAY).toBe(200);
  });
});
