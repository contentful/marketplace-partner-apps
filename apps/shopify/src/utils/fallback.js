/**
 * Creates a fallback preview object for when Shopify data cannot be fetched.
 * 
 * @param {string} sku - The SKU identifier
 * @returns {Object} A fallback preview object marked as missing
 */
export const createFallbackPreview = (sku) => ({
  id: sku,
  image: '',
  isMissing: true,
  name: '',
  sku,
});
