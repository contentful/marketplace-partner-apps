import { pick } from 'lodash';
import { CloudinaryAsset, MediaLibraryResultAsset } from './types';

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
      url: asset.derived[0].url,
      secure_url: asset.derived[0].secure_url,
      raw_transformation: asset.derived[0].raw_transformation,
    };
  }

  return res;
}
