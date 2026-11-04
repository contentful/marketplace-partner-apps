import { type Asset, getThumbUrl } from '@raster-app/react';
import type { Image } from './types';

/**
 * The picker's asset, as the field stores it. Its URLs stay bare, without the SDK's `?v=`
 * content version, as the field has always stored them: sites may add their own query.
 */
export function toImage(asset: Asset): Image {
  const { id, parentId, blurhash, url, sizes, name, height, width, variants, description } = asset;
  const views = (variants ?? [])
    .filter((variant) => variant !== null)
    .map((variant) => ({
      id: variant.id,
      parentId: variant.parentId,
      name: variant.name,
      url: variant.url,
      thumbUrl: getThumbUrl(variant) ?? null,
      height: variant.height,
      width: variant.width,
    }));
  return {
    id,
    ...(parentId !== null && { parentId }),
    blurhash,
    thumbUrl: getThumbUrl({ url, sizes }) ?? null,
    url,
    name,
    height,
    width,
    views,
    // Only an original keeps its description.
    description: parentId === null ? description : null,
  };
}

/** Why the field, which holds images only, would not take the asset; or null. */
export function whyRefused(asset: Asset): string | null {
  // Some variant rows carry no type of their own, and a variant shares its original's kind.
  const type = asset.contentType ?? (asset.parentId === null ? null : 'image/*');
  if (type === null) return 'Raster has no file type for this asset, so this field cannot take it.';
  if (!type.toLowerCase().startsWith('image/')) return 'Only images can be used in this field.';
  if (asset.url === null) return 'Raster has no file for this asset yet.';
  return null;
}
