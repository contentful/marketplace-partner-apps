import get from 'lodash/get';
import flatten from 'lodash/flatten';
import {DEFAULT_SHOPIFY_VARIANT_TITLE, SKU_ID} from './constants';
import {convertBase64ToString, convertStringToBase64} from './utils/base64';

/**
 * Decodes the ID of a Shopify resource
 * The ID is encoded in base64 and the actual ID is the last part of the string
 * e.g. gid://shopify/Product/1234567890 -> 1234567890
 */
export const decodeId = (sku) => {
    const decodedId = convertBase64ToString(sku);
    return decodedId && decodedId.slice(decodedId.lastIndexOf('/') + 1);
};

/**
 * Removes the protocol and trailing slash from a URL
 * This is a QOL for users who copy-paste the URL from the browser
 */
export const removeHttpsAndTrailingSlash = (url) => {
    const protocol = /^https?:\/\/(www\.)?/;
    const trailingSlash = /\/$/;

    return url.replace(protocol, '').replace(trailingSlash, '');
};

/**
 * Transforms the API response of Shopify collections into
 * the product schema expected by the SkuPicker component
 */
export const collectionDataTransformer = (collection, apiEndpoint) => {
    const image = get(collection, ['image', 'src'], '');
    const handle = get(collection, ['handle'], undefined);

    const collectionId = decodeId(collection.id);
    const externalLink = apiEndpoint && collectionId && `https://${removeHttpsAndTrailingSlash(apiEndpoint)}/admin/collections/${collectionId}`;
    const productsCount =  collection.products?.edges?.length ?? 0

    return {
        id: collection.id,
        image,
        name: collection.title,
        description: collection.description,
        displaySKU: handle ? `Handle: ${handle}` : `Collection ID: ${collection.id}`,
        sku: collection.id,
        ...{externalLink},
        additionalData: {
            type: SKU_ID.collection,
            description: collection.description,
            updatedAt: collection.updatedAt,
            productsCount: productsCount > 100 ? `> 100` : productsCount
        },
    };
};

/**
 * Transforms the API response of Shopify products into
 * the product schema expected by the SkuPicker component
 */
export const productDataTransformer = (product, apiEndpoint) => {
    const image = get(product, ['images', 0, 'src'], '');
    const sku = get(product, ['variants', 0, 'sku'], undefined);

    const productId = decodeId(product.id);
    const externalLink = apiEndpoint && productId && `https://${removeHttpsAndTrailingSlash(apiEndpoint)}/admin/products/${productId}`;

    let price = 'no variants found';

    if (!!product.variants?.length) {
        const firstPriceCurrencyCode = product.variants[0].price.currencyCode;

        const prices = product.variants
            .filter((variant) => variant.price.currencyCode === firstPriceCurrencyCode)
            .map((variant) => variant.price.amount)
            .sort();

        const formatter = currencyFormatter(firstPriceCurrencyCode);
        const firstPrice = prices[0]
        const lastPrice = prices[prices.length - 1]

        price = firstPrice === lastPrice
            ? formatter.format(firstPrice)
            : `${formatter.format(firstPrice)} - ${formatter.format(lastPrice)}`;
    }

    return {
        id: product.id,
        image,
        name: product.title,
        displaySKU: sku ? `SKU: ${sku}` : `Product ID: ${product.id}`,
        sku: product.id,
        description: product.description,
        ...{externalLink},
        additionalData: {
            type: SKU_ID.product,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            vendor: product.vendor,
            price,
            quantityAvailable: 'Depending on variants',
        },
    };
};

/**
 * Transforms the API response of Shopify product variants into
 * the product schema expected by the SkuPicker component
 */
export const productVariantDataTransformer = (product) => {
    const image = get(product, ['image', 'src'], '');
    const sku = get(product, ['sku'], '');
    const variantSKU = get(product, ['variantSKU'], '');

    return {
        id: product.id,
        image,
        name: product.title,
        displaySKU: variantSKU ? `SKU: ${variantSKU}` : `Product ID: ${sku}`,
        sku,
        additionalData: {
            type: SKU_ID.variant,
            ...product,
        },
    };
};

export const productsToVariantsTransformer = (products) =>
    flatten(
        products.map((product) => {
            const variants = product.variants.map((variant) => ({
                ...variant,
                variantSKU: variant.sku,
                id: convertStringToBase64(variant.id),
                sku: convertStringToBase64(variant.id),
                productId: product.id,
                description: product.description,
                title: variant.title === DEFAULT_SHOPIFY_VARIANT_TITLE ? product.title : `${product.title} (${variant.title})`,
                additionalData: {
                    type: SKU_ID.variant,
                    ...product,
                },
            }));
            return variants;
        })
    );

export const previewsToProductVariants =
    ({apiEndpoint}) =>
        ({sku, id, image, product, title, quantityAvailable, price}) => {
            const productId = decodeId(product.id);
            const externalLink = apiEndpoint && productId && `https://${removeHttpsAndTrailingSlash(apiEndpoint)}/admin/products/${productId}`;

            return {
                id,
                image: get(image, ['src'], ''),
                // TODO: Remove sku:id when @contentful/ecommerce-app-base supports internal IDs
                // as an alternative piece of info to persist instead of the SKU.
                // For now this is a temporary hack.
                sku: id,
                displaySKU: sku ? `SKU: ${sku}` : `Product ID: ${id}`,
                productId: product.id,
                name: title === DEFAULT_SHOPIFY_VARIANT_TITLE ? product.title : `${product.title} (${title})`,
                ...{externalLink},
                description: product.description,
                additionalData: {
                    type: SKU_ID.product,
                    quantityAvailable,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt,
                    vendor: product.vendor,
                    price: !!price.amount ? currencyFormatter(price.currencyCode).format(parseFloat(price.amount)) : 'unknown',
                },
            };
        };

const currencyFormatter = (currency) =>
    new Intl.NumberFormat('en-US', {style: 'currency', currency});
