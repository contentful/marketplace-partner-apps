import { FieldAppSDK } from '@contentful/app-sdk';
import { Cloudinary as cloudinaryCore } from 'cloudinary-core';
import { pick } from 'lodash';
import { AppInstallationParameters, CloudinaryAsset, MediaLibraryResultAsset } from './types';

export function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const scripts = document.getElementsByTagName('script')[0];
    const script = document.createElement('script');

    script.type = 'text/javascript';
    script.src = src;

    script.addEventListener('load', () => resolve());
    script.addEventListener('error', (e) => reject(e));

    scripts.parentNode!.insertBefore(script, scripts);
  });
}

const FIELDS_TO_PERSIST = [
  'url',
  'tags',
  'type',
  'bytes',
  'width',
  'format',
  'height',
  'version',
  'duration',
  'metadata',
  'context',
  'public_id',
  'created_at',
  'secure_url',
  'resource_type',
  'original_url',
  'original_secure_url',
  'raw_transformation',
] as const;

export function getDeliveryHostname(url: string): string | undefined {
  try {
    const { hostname } = new URL(url);
    return hostname === 'res.cloudinary.com' ? undefined : hostname;
  } catch {
    return undefined;
  }
}

export function getEditorTransformation(asset: CloudinaryAsset): string | undefined {
  return asset.raw_transformation ?? asset.original_raw_transformation;
}

export function buildDeliveryUrl(
  installationParams: AppInstallationParameters,
  asset: CloudinaryAsset,
  rawTransformation: string,
  referenceUrl?: string
): string {
  const reference = referenceUrl ?? asset.original_secure_url ?? asset.secure_url ?? asset.url;
  const deliveryHostname = reference ? getDeliveryHostname(reference) : undefined;

  const config: Record<string, string | boolean> = {
    cloud_name: installationParams.cloudName,
    api_key: installationParams.apiKey,
  };
  if (deliveryHostname) {
    config.cname = deliveryHostname;
    config.secure_distribution = deliveryHostname;
    config.private_cdn = true;
  }

  const cloudinary = new cloudinaryCore(config);
  const options: Record<string, string | boolean> = {
    type: asset.type,
    rawTransformation: rawTransformation,
    secure: !reference?.startsWith('http:'),
  };
  if (asset.version != null) {
    options.version = String(asset.version);
  }

  let url = cloudinary.url(asset.public_id, options);
  if (reference?.startsWith('http:')) {
    url = url.replace(/^https:/, 'http:');
  }
  return url;
}

export function createEditedAsset(asset: CloudinaryAsset, installationParams: AppInstallationParameters, rawTransformation: string): CloudinaryAsset {
  const referenceUrl = asset.original_secure_url ?? asset.secure_url ?? asset.url;
  const secureUrl = buildDeliveryUrl(installationParams, asset, rawTransformation, referenceUrl);
  const url = secureUrl.replace(/^https:/, 'http:');

  const preservedOriginals = asset.original_secure_url
    ? {}
    : {
        original_secure_url: asset.secure_url,
        original_url: asset.url,
        original_raw_transformation: asset.raw_transformation,
      };

  return {
    ...asset,
    ...preservedOriginals,
    raw_transformation: rawTransformation,
    secure_url: secureUrl,
    url,
  };
}

export function extractAsset(asset: MediaLibraryResultAsset): CloudinaryAsset {
  let res = pick(asset, FIELDS_TO_PERSIST) as CloudinaryAsset;
  // if we have a derived images, we replace the URL with the derived URL and store the origianl URL seperatly
  if (asset.derived) {
    res = {
      ...res,
      original_url: res.url,
      original_secure_url: res.secure_url,
      original_raw_transformation: res.raw_transformation,
      original_transformed_url: asset.derived[0].url,
      url: asset.derived[0].url,
      secure_url: asset.derived[0].secure_url,
      raw_transformation: asset.derived[0].raw_transformation,
    };
  }

  return res;
}

function evaluator(template: string, context: Record<string, unknown>, sdk: FieldAppSDK) {
  try {
    return new Function(...Object.keys(context), 'return `' + template + '`;')(...Object.values(context));
  } catch (error) {
    // show error notification to the user
    sdk.notifier.error(`Invalid field configuration ${template}\n${error}`);
    console.error(error);
    return template;
  }
}

/*
 * To open the media library dialog with a scoped search filter you should pass the resource type (image, video) and the sdk instance (to get the instance parameters)
 * The function returns a string filter expression, or undefined if the expression is empty
 */
export function mediaLibraryFilter(type: string, sdk: FieldAppSDK<AppInstallationParameters>) {
  let expression = type !== '' ? `resource_type:${type}` : ``;
  const searchFilterTemplate = (sdk.parameters.instance.searchFilter || '') as string;

  const binding = {
    entry: sdk.entry,
  };
  const hasSearchPrefix = !!expression;
  const searchFilterIsEmpty = !!searchFilterTemplate;
  const searchFilterStartsWithBooleanOperator = searchFilterTemplate.match(/^\s*(AND|OR).*$/) !== null;
  const shouldAppendImplicitAndOperator = hasSearchPrefix && searchFilterIsEmpty && !searchFilterStartsWithBooleanOperator;
  const defaultBooleanOperator = shouldAppendImplicitAndOperator ? ' AND ' : '';

  const searchFilter = ` ${evaluator(searchFilterTemplate, binding, sdk)}`;
  expression = `${expression}${defaultBooleanOperator}${searchFilter}`;

  if (expression.trim() === '') {
    return undefined;
  }
  return expression;
}
