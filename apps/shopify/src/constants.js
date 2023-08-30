// If one creates product with no variants in Shopify, a default variant is
// returned with this unfortunate title, and there is no other way to check
// whether the returned variant is the default one or not
export const DEFAULT_SHOPIFY_VARIANT_TITLE = 'Default Title';
export const SHOPIFY_API_VERSION = '2023-01';
export const SHOPIFY_ENTITY_LIMIT = 250;

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
