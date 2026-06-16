import { describe, expect, it } from 'vitest';
import { AppInstallationParameters, CloudinaryAsset } from './types';
import { buildDeliveryUrl, createEditedAsset, getDeliveryHostname, getEditorTransformation } from './utils';

const installationParams: AppInstallationParameters = {
  installationUuid: 'test',
  cloudName: 'prod01-ssg-service',
  apiKey: 'test-key',
  maxFiles: 1,
  startFolder: '',
  quality: 'auto',
  format: 'auto',
  showUploadButton: 'true',
  imageEditorOverlays: [],
};

const baseAsset: CloudinaryAsset = {
  url: 'http://static.scott-sports.com/image/upload/f_auto/q_auto/v1779450624/SPARK_RC_SCOTT_BIKE_TECH_0125.jpg',
  secure_url: 'https://static.scott-sports.com/image/upload/f_auto/q_auto/v1779450624/SPARK_RC_SCOTT_BIKE_TECH_0125.jpg',
  tags: [],
  type: 'upload',
  bytes: 1,
  width: 4000,
  format: 'jpg',
  height: 2250,
  version: 1779450624,
  duration: null,
  metadata: [],
  public_id: 'SPARK_RC_SCOTT_BIKE_TECH_0125',
  created_at: '2026-05-22T11:50:24Z',
  resource_type: 'image',
};

describe('getDeliveryHostname', () => {
  it('returns custom delivery hostnames', () => {
    expect(getDeliveryHostname('https://static.scott-sports.com/image/upload/test')).toBe('static.scott-sports.com');
  });

  it('returns undefined for the default Cloudinary hostname', () => {
    expect(getDeliveryHostname('https://res.cloudinary.com/demo/image/upload/test')).toBeUndefined();
  });
});

describe('getEditorTransformation', () => {
  it('prefers the current transformation over the original', () => {
    const asset: CloudinaryAsset = {
      ...baseAsset,
      raw_transformation: 'c_crop,h_100,w_100,x_0,y_0',
      original_raw_transformation: 'f_auto/q_auto',
    };

    expect(getEditorTransformation(asset)).toBe('c_crop,h_100,w_100,x_0,y_0');
  });

  it('falls back to the original transformation', () => {
    const asset: CloudinaryAsset = {
      ...baseAsset,
      original_raw_transformation: 'f_auto/q_auto',
    };

    expect(getEditorTransformation(asset)).toBe('f_auto/q_auto');
  });
});

describe('buildDeliveryUrl', () => {
  it('builds edited URLs on the configured CNAME', () => {
    const url = buildDeliveryUrl(installationParams, baseAsset, 'c_crop,h_2250,w_2250,x_1750,y_0/c_scale,h_2250,w_2250/f_auto/q_auto');

    expect(url).toContain('static.scott-sports.com');
    expect(url).toContain('c_crop,h_2250,w_2250,x_1750,y_0');
    expect(url).not.toContain('res.cloudinary.com');
  });
});

describe('createEditedAsset', () => {
  it('preserves original URLs on the first edit and uses the CNAME for delivery', () => {
    const edited = createEditedAsset(baseAsset, installationParams, 'c_crop,h_2250,w_2250,x_1750,y_0/c_scale,h_2250,w_2250/f_auto/q_auto');

    expect(edited.original_secure_url).toBe(baseAsset.secure_url);
    expect(edited.original_url).toBe(baseAsset.url);
    expect(edited.secure_url).toContain('static.scott-sports.com');
    expect(edited.url).toContain('static.scott-sports.com');
    expect(edited.raw_transformation).toBe('c_crop,h_2250,w_2250,x_1750,y_0/c_scale,h_2250,w_2250/f_auto/q_auto');
  });
});
