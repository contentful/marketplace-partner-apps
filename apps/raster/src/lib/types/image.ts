import type { Asset, AssetVariant } from '@raster-app/react';

/** A version of an image, as `Image.views` stores it. */
export type ImageView = Pick<AssetVariant, 'id' | 'parentId' | 'name' | 'url' | 'height' | 'width'> & {
  thumbUrl: string | null;
};

/** One picked image as the field stores it: the keys it has always held, so saved entries and the sites reading them keep working. */
export type Image = Pick<Asset, 'id' | 'blurhash' | 'url' | 'name' | 'height' | 'width' | 'description'> & {
  /** Only on a picked version. */
  parentId?: string;
  thumbUrl: string | null;
  views: ImageView[];
};
