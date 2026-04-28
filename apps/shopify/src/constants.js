// If one creates product with no variants in Shopify, a default variant is
// returned with this unfortunate title, and there is no other way to check
// whether the returned variant is the default one or not
export const DEFAULT_SHOPIFY_VARIANT_TITLE = 'Default Title';
export const SHOPIFY_ENTITY_LIMIT = 250;
export const SHOPIFY_SUPPORTED_API_VERSIONS = ['2025-07', '2025-10', '2026-01', '2026-04'];
export const SHOPIFY_DEFAULT_API_VERSION = '2025-07';

export function resolveShopifyApiVersion(config = {}) {
  const apiVersion = config.apiVersion;

  if (SHOPIFY_SUPPORTED_API_VERSIONS.includes(apiVersion)) {
    return apiVersion;
  }

  return SHOPIFY_DEFAULT_API_VERSION;
}

export const ENTITY_TYPE = {
  product: 'product',
  variant: 'variant',
  collection: 'collection',
};

export const SKU_TYPES = [
  {
    id: ENTITY_TYPE.product,
    name: 'Product',
  },
  {
    id: ENTITY_TYPE.variant,
    name: 'Product variant',
    default: true,
  },
  {
    id: ENTITY_TYPE.collection,
    name: 'Collection',
  },
];
