import { FieldAppSDK } from '@contentful/app-sdk';
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

  const shouldAppendImplicitAndOperator = searchFilterTemplate.match(/^\s*(AND|OR).*$/) || !searchFilterTemplate;
  const defaultBooleanOperator = shouldAppendImplicitAndOperator ? '' : ' AND ';
  const searchFilter = ` ${evaluator(searchFilterTemplate, binding, sdk)}`;
  expression = `${expression}${defaultBooleanOperator}${searchFilter}`;
  if (expression.trim() === '') {
    return undefined;
  }
  return expression;
}
