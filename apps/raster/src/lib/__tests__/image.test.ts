import type { Asset } from '@raster-app/react';
import { expect } from 'vitest';
import { toImage } from '../image';

const asset = {
  id: 'asset-1',
  parentId: null,
  libraryId: 'library-1',
  name: 'Beach',
  description: 'A beach at sunset',
  url: 'https://cdn.raster.app/beach.jpg',
  sizes: JSON.stringify({ 400: 'https://cdn.raster.app/beach-400.jpg', 1080: 'https://cdn.raster.app/beach-1080.jpg' }),
  width: 1920,
  height: 1080,
  blurhash: 'UUKJMXx',
  contentVersion: null,
  appUrl: 'https://raster.app/acme/library-1/asset-1',
  variants: [
    {
      id: 'variant-1',
      parentId: 'asset-1',
      name: 'Beach crop',
      url: 'https://cdn.raster.app/beach-crop.jpg',
      sizes: null,
      width: 800,
      height: 800,
      appUrl: null,
    },
    null,
  ],
} as Asset;

describe('toImage', () => {
  it('stores an asset with the keys the field has always held', () => {
    expect(toImage(asset)).toStrictEqual({
      id: 'asset-1',
      blurhash: 'UUKJMXx',
      thumbUrl: 'https://cdn.raster.app/beach-400.jpg',
      url: 'https://cdn.raster.app/beach.jpg',
      name: 'Beach',
      height: 1080,
      width: 1920,
      views: [
        {
          id: 'variant-1',
          parentId: 'asset-1',
          name: 'Beach crop',
          url: 'https://cdn.raster.app/beach-crop.jpg',
          thumbUrl: 'https://cdn.raster.app/beach-crop.jpg',
          height: 800,
          width: 800,
        },
      ],
      description: 'A beach at sunset',
    });
  });

  it('stores bare URLs, which sites may add their own query to', () => {
    expect(toImage({ ...asset, contentVersion: 2 } as Asset)).toMatchObject({
      url: 'https://cdn.raster.app/beach.jpg',
      thumbUrl: 'https://cdn.raster.app/beach-400.jpg',
    });
  });

  it('keeps the parent of a picked variant, and no description of its own', () => {
    const variant = { ...asset, id: 'variant-1', parentId: 'asset-1', variants: null } as Asset;

    expect(toImage(variant)).toMatchObject({ id: 'variant-1', parentId: 'asset-1', views: [], description: null });
  });
});
