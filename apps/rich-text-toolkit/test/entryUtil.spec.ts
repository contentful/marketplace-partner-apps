import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { BaseAppSDK } from '@contentful/app-sdk';
import { CreateImageWrapperEntry } from '../src/entryUtil';

describe('entryUtil', () => {
  const mockSdk = {
    cma: {
      locale: {
        getMany: vi.fn(),
      },
      contentType: {
        get: vi.fn(),
      },
      entry: {
        createWithId: vi.fn(),
      },
    },
    parameters: {
      installation: {
        imageWrapperTypeId: 'imageWrapper',
      },
    },
  } as unknown as BaseAppSDK;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CreateImageWrapperEntry', () => {
    it('should create an entry with image field only when no display field is defined', async () => {
      const mockContentType = {
        fields: [
          {
            id: 'image',
            type: 'Link',
            linkType: 'Asset',
          },
        ],
      };

      (mockSdk.cma.locale.getMany as Mock).mockResolvedValue({
        items: [{ default: true, code: 'en-US' }],
      });
      (mockSdk.cma.contentType.get as Mock).mockResolvedValue(mockContentType);
      (mockSdk.cma.entry.createWithId as Mock).mockResolvedValue({ sys: { id: 'new-entry' } });

      const result = await CreateImageWrapperEntry(
        mockSdk,
        'space-id',
        'env-id',
        'asset-123',
        'https://example.com/test-image.jpg',
        'entry-id'
      );

      expect(mockSdk.cma.entry.createWithId).toHaveBeenCalledWith(
        {
          spaceId: 'space-id',
          environmentId: 'env-id',
          contentTypeId: 'imageWrapper',
          entryId: 'entry-id',
        },
        {
          fields: {
            image: {
              'en-US': {
                sys: {
                  id: 'asset-123',
                  type: 'Link',
                  linkType: 'Asset',
                },
              },
            },
          },
        }
      );
      expect(result).toEqual({ sys: { id: 'new-entry' } });
    });

    it('should create an entry with both image and display fields when display field is defined', async () => {
      const mockContentType = {
        displayField: 'title',
        fields: [
          {
            id: 'title',
            type: 'Symbol',
          },
          {
            id: 'image',
            type: 'Link',
            linkType: 'Asset',
          },
        ],
      };

      (mockSdk.cma.locale.getMany as Mock).mockResolvedValue({
        items: [{ default: true, code: 'en-US' }],
      });
      (mockSdk.cma.contentType.get as Mock).mockResolvedValue(mockContentType);
      (mockSdk.cma.entry.createWithId as Mock).mockResolvedValue({ sys: { id: 'new-entry' } });

      const result = await CreateImageWrapperEntry(
        mockSdk,
        'space-id',
        'env-id',
        'asset-123',
        'https://example.com/test-image.jpg',
        'entry-id'
      );

      expect(mockSdk.cma.entry.createWithId).toHaveBeenCalledWith(
        {
          spaceId: 'space-id',
          environmentId: 'env-id',
          contentTypeId: 'imageWrapper',
          entryId: 'entry-id',
        },
        {
          fields: {
            title: {
              'en-US': 'test-image',
            },
            image: {
              'en-US': {
                sys: {
                  id: 'asset-123',
                  type: 'Link',
                  linkType: 'Asset',
                },
              },
            },
          },
        }
      );
      expect(result).toEqual({ sys: { id: 'new-entry' } });
    });

    it('should throw error when image field is not found in content type', async () => {
      const mockContentType = {
        fields: [
          {
            id: 'title',
            type: 'Symbol',
          },
        ],
      };

      (mockSdk.cma.locale.getMany as Mock).mockResolvedValue({
        items: [{ default: true, code: 'en-US' }],
      });
      (mockSdk.cma.contentType.get as Mock).mockResolvedValue(mockContentType);

      await expect(
        CreateImageWrapperEntry(
          mockSdk,
          'space-id',
          'env-id',
          'asset-123',
          'https://example.com/test-image.jpg',
          'entry-id'
        )
      ).rejects.toThrow('Image field not found in content type');
    });

    it('should handle URLs without file extension', async () => {
      const mockContentType = {
        displayField: 'title',
        fields: [
          {
            id: 'title',
            type: 'Symbol',
          },
          {
            id: 'image',
            type: 'Link',
            linkType: 'Asset',
          },
        ],
      };

      (mockSdk.cma.locale.getMany as Mock).mockResolvedValue({
        items: [{ default: true, code: 'en-US' }],
      });
      (mockSdk.cma.contentType.get as Mock).mockResolvedValue(mockContentType);
      (mockSdk.cma.entry.createWithId as Mock).mockResolvedValue({ sys: { id: 'new-entry' } });

      await CreateImageWrapperEntry(
        mockSdk,
        'space-id',
        'env-id',
        'asset-123',
        'https://example.com/image',
        'entry-id'
      );

      expect(mockSdk.cma.entry.createWithId).toHaveBeenCalledWith(
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

    it('should handle missing default locale', async () => {
      (mockSdk.cma.locale.getMany as Mock).mockResolvedValue({
        items: [],
      });

      const mockContentType = {
        fields: [
          {
            id: 'image',
            type: 'Link',
            linkType: 'Asset',
          },
        ],
      };

      (mockSdk.cma.contentType.get as Mock).mockResolvedValue(mockContentType);

      await expect(
        CreateImageWrapperEntry(
          mockSdk,
          'space-id',
          'env-id',
          'asset-123',
          'https://example.com/test-image.jpg',
          'entry-id'
        )
      ).rejects.toThrow();
    });
  });
});
