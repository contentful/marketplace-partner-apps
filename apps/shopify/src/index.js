import { setup, renderSkuPicker } from '@contentful/ecommerce-app-base';
import { fetchProductVariantPreviews, fetchProductPreviews, fetchCollectionPreviews, makeSkuResolver } from './skuResolvers';
import { SKU_TYPES } from './constants';
import { validateParameters } from './utils/validation';

import logo from './logo.svg';
import { AdditionalDataRenderer } from './additionalDataRenderer';

const DIALOG_ID = 'dialog-root';

function makeCTA(fieldType, skuType) {
  if (skuType === 'product') {
    return fieldType === 'Array' ? 'Select products' : 'Select a product';
  }

  if (skuType === 'collection') {
    return fieldType === 'Array' ? 'Select collections' : 'Select a collection';
  }

  return fieldType === 'Array' ? 'Select product variants' : 'Select a product variant';
}

function makeSaveBtnText(skuType) {
  if (skuType === 'product') {
    return (selectedSKUs) => {
      switch (selectedSKUs.length) {
        case 0:
          return 'Save products';
        case 1:
          return 'Save 1 product';
        default:
          return `Save ${selectedSKUs.length} products`;
      }
    };
  }

  if (skuType === 'collection') {
    return (selectedSKUs) => {
      switch (selectedSKUs.length) {
        case 0:
          return 'Save collections';
        case 1:
          return 'Save 1 collection';
        default:
          return `Save ${selectedSKUs.length} collections`;
      }
    };
  }

  return (selectedSKUs) => {
    switch (selectedSKUs.length) {
      case 0:
        return 'Save product variants';
      case 1:
        return 'Save 1 product variant';
      default:
        return `Save ${selectedSKUs.length} product variants`;
    }
  };
}

function makeSearchPlaceholderText(skuType) {
  if (skuType === 'product') {
    return 'Search for a product...';
  }

  if (skuType === 'collection') {
    return 'Search for a collection...';
  }

  return 'Search for a product variant...';
}

function fetchPreviews(skus, config, skuType) {
  if (skuType === 'product') {
    return fetchProductPreviews(skus, config);
  }

  if (skuType === 'collection') {
    return fetchCollectionPreviews(skus, config);
  }

  return fetchProductVariantPreviews(skus, config);
}

async function renderDialog(sdk) {
  const container = document.createElement('div');
  container.id = DIALOG_ID;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  document.body.appendChild(container);

  const skuType = sdk.parameters?.invocation?.skuType;

  renderSkuPicker(DIALOG_ID, {
    sdk,
    fetchProductPreviews: fetchPreviews,
    fetchProducts: await makeSkuResolver(sdk, skuType),
    searchDelay: 750,
    skuType,
    makeSaveBtnText: makeSaveBtnText(skuType),
    makeSearchPlaceholderText,
  });

  sdk.window.startAutoResizer();
}

async function openDialog(sdk, currentValue, config) {
  const skus = await sdk.dialogs.openCurrentApp({
    allowHeightOverflow: true,
    position: 'center',
    title: makeCTA(sdk.field.type, config.skuType),
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEscapePress: true,
    parameters: config,
    width: 1400,
  });

  return Array.isArray(skus) ? skus : [];
}

function isDisabled(/* currentValue, config */) {
  // No restrictions need to be imposed as to when the field is disabled from the app's side
  return false;
}

setup({
  makeCTA,
  name: 'Shopify',
  logo,
  description: 'The Shopify app allows editors to select products from their Shopify account and reference them inside of Contentful entries.',
  color: '#212F3F',
  parameterDefinitions: [
    {
      id: 'storefrontAccessToken',
      name: 'Storefront Access Token',
      description: 'The storefront access token to your Shopify store',
      type: 'Symbol',
      required: true,
    },
    {
      id: 'apiEndpoint',
      name: 'Store URL',
      description: 'The Shopify store URL (e.g. [your-shop-name].myshopify.com)',
      type: 'Symbol',
      required: true,
    },
  ],
  skuTypes: SKU_TYPES,
  isInOrchestrationEAP: true,
  fetchProductPreviews: fetchPreviews,
  renderDialog,
  openDialog,
  isDisabled,
  validateParameters,
  productCardVersion: 'v2',
  additionalDataRenderer: AdditionalDataRenderer,
});
