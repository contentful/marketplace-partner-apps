/**
 * Sleep utility for delays
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Determines if an error is retryable based on the error type and status code
 */
const isRetryableError = (error) => {
  // Network errors, timeouts, and 5xx errors are retryable
  if (!error) return false;

  const errorMessage = error.message || error.toString() || '';

  // Check for network errors
  if (
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Network request failed')
  ) {
    return true;
  }

  // Check for HTTP status codes
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    // Retry on 429 (rate limit), 500, 502, 503, 504
    return status === 429 || (status >= 500 && status < 600);
  }

  // Check response object (for fetch API errors)
  if (error.response) {
    const status = error.response.status || error.response.statusCode;
    if (status) {
      return status === 429 || (status >= 500 && status < 600);
    }
  }

  // Check for GraphQL errors that might be transient
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors.some((err) => {
      const code = err.extensions?.code;
      // Retry on rate limit or internal server errors
      return code === 'THROTTLED' || code === 'INTERNAL_SERVER_ERROR';
    });
  }

  // Check error message for common retryable error patterns
  if (
    errorMessage.includes('500') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503') ||
    errorMessage.includes('504') ||
    errorMessage.includes('429') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('throttled') ||
    errorMessage.includes('INTERNAL_SERVER_ERROR')
  ) {
    return true;
  }

  return false;
};

/**
 * Gets the retry delay from response headers (for rate limiting)
 */
const getRetryAfterDelay = (error) => {
  if (error.response?.headers) {
    const retryAfter = error.response.headers.get('retry-after') || error.response.headers['retry-after'];
    if (retryAfter) {
      return parseInt(retryAfter, 10) * 1000; // Convert to milliseconds
    }
  }
  return null;
};

/**
 * Retries a function with exponential backoff
 *
 * @param {Function} fn - The async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in milliseconds (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 10000)
 * @param {number} options.backoffMultiplier - Multiplier for exponential backoff (default: 2)
 * @param {Function} options.shouldRetry - Custom function to determine if error is retryable
 * @returns {Promise} - The result of the function
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000, backoffMultiplier = 2, shouldRetry = isRetryableError } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted all attempts
      if (attempt >= maxRetries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!shouldRetry(error)) {
        break;
      }

      // Use retry-after header if available (for rate limiting)
      const retryAfterDelay = getRetryAfterDelay(error);
      if (retryAfterDelay) {
        delay = Math.min(retryAfterDelay, maxDelay);
      } else {
        // Exponential backoff
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }

      console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, error.message || error);

      await sleep(delay);
    }
  }

  // All retries exhausted, throw the last error
  throw lastError;
};
