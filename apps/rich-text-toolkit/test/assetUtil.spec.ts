import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { CMAClient } from '@contentful/app-sdk';
import { uploadImageFromUrl } from '../src/assetUtil';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('assetUtil', () => {
  const mockCma = {
    locale: {
      getMany: vi.fn(),
    },
    asset: {
      createWithId: vi.fn(),
      processForAllLocales: vi.fn(),
      publish: vi.fn(),
    },
  } as unknown as CMAClient;

  const mockResponse = {
    ok: true,
    headers: new Headers({
      'content-type': 'image/jpeg',
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(mockResponse);
  });

  describe('uploadImageFromUrl', () => {
    it('should successfully upload an image from URL', async () => {
      const mockAsset = {
        sys: { id: 'test-asset-id' },
      };

      (mockCma.locale.getMany as Mock).mockResolvedValue({
        items: [{ default: true, code: 'en-US' }],
      });
      (mockCma.asset.createWithId as Mock).mockResolvedValue(mockAsset);
      (mockCma.asset.processForAllLocales as Mock).mockResolvedValue(mockAsset);
      (mockCma.asset.publish as Mock).mockResolvedValue(mockAsset);

      const result = await uploadImageFromUrl(
        mockCma,
        'space-id',
        'env-id',
        'https://example.com/image.jpg',
        'Test Alt Text',
        'test-asset-id'
      );

      expect(result).toEqual(mockAsset);
      expect(mockCma.asset.createWithId).toHaveBeenCalledWith(
        {
          spaceId: 'space-id',
          environmentId: 'env-id',
          assetId: 'test-asset-id',
        },
        {
          fields: {
            title: {
              'en-US': 'image',
            },
            description: {
              'en-US': 'Test Alt Text',
            },
            file: {
              'en-US': {
                contentType: 'image/jpeg',
                fileName: 'image.jpg',
                upload: 'https://example.com/image.jpg',
              },
            },
          },
        }
      );
    });

    it('should append cache-bust to Google user content URLs', async () => {
      const googleImageUrl = 'https://googleusercontent.com/image.jpg';
      (mockCma.locale.getMany as Mock).mockResolvedValue({
        items: [{ default: true, code: 'en-US' }],
      });

      await uploadImageFromUrl(
        mockCma,
        'space-id',
        'env-id',
        googleImageUrl,
        'Alt Text',
        'test-id'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://googleusercontent.com/image.jpg&cache-bust',
        expect.any(Object)
      );
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(
        uploadImageFromUrl(
          mockCma,
          'space-id',
          'env-id',
          'https://example.com/image.jpg',
          'Alt Text',
          'test-id'
        )
      ).rejects.toThrow('Failed to fetch image from URL');
    });

    it('should handle missing file extension in URL', async () => {
      const mockAsset = {
        sys: { id: 'test-asset-id' },
      };

      (mockCma.locale.getMany as Mock).mockResolvedValue({
        items: [{ default: true, code: 'en-US' }],
      });
      (mockCma.asset.createWithId as Mock).mockResolvedValue(mockAsset);
      (mockCma.asset.processForAllLocales as Mock).mockResolvedValue(mockAsset);
      (mockCma.asset.publish as Mock).mockResolvedValue(mockAsset);

      await uploadImageFromUrl(
        mockCma,
        'space-id',
        'env-id',
        'https://example.com/image',
        'Alt Text',
        'test-id'
      );

      expect(mockCma.asset.createWithId).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          fields: expect.objectContaining({
            title: {
              'en-US': 'image',
            },
          }),
        })
      );
    });

    it('should process and publish the asset after creation', async () => {
      const mockAsset = {
        sys: { id: 'test-asset-id' },
      };

      (mockCma.locale.getMany as Mock).mockResolvedValue({
        items: [{ default: true, code: 'en-US' }],
      });
      (mockCma.asset.createWithId as Mock).mockResolvedValue(mockAsset);
      (mockCma.asset.processForAllLocales as Mock).mockResolvedValue(mockAsset);
      (mockCma.asset.publish as Mock).mockResolvedValue(mockAsset);

      await uploadImageFromUrl(
        mockCma,
        'space-id',
        'env-id',
        'https://example.com/image.jpg',
        'Alt Text',
        'test-id'
      );

      expect(mockCma.asset.processForAllLocales).toHaveBeenCalledWith(
        {},
        mockAsset
      );
      expect(mockCma.asset.publish).toHaveBeenCalledWith(
        { assetId: 'test-asset-id' },
        mockAsset
      );
    });
  });
});
