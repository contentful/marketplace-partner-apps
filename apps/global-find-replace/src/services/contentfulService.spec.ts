import { describe, expect, it, vi } from 'vitest';
import { ContentfulService } from './contentfulService';

describe('ContentfulService.getContentTypes', () => {
  it('fetches every page of content types', async () => {
    const getMany = vi
      .fn()
      .mockResolvedValueOnce({
        items: Array.from({ length: 100 }, (_, index) => ({
          sys: { id: `content-type-${index}` },
          name: `Content Type ${index}`,
          fields: [],
        })),
        total: 150,
      })
      .mockResolvedValueOnce({
        items: Array.from({ length: 50 }, (_, index) => ({
          sys: { id: `content-type-${index + 100}` },
          name: `Content Type ${index + 100}`,
          fields: [],
        })),
        total: 150,
      });

    const sdk = {
      cma: {
        contentType: {
          getMany,
        },
      },
      locales: {
        names: {},
      },
    } as any;

    const service = new ContentfulService(sdk);

    await expect(service.getContentTypes()).resolves.toHaveLength(150);
    expect(getMany).toHaveBeenNthCalledWith(1, {
      query: {
        limit: 100,
        skip: 0,
      },
    });
    expect(getMany).toHaveBeenNthCalledWith(2, {
      query: {
        limit: 100,
        skip: 100,
      },
    });
  });
});
