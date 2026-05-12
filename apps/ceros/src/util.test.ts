import { vi, describe, it, expect, beforeEach } from 'vitest';
import { handleError, createDefaultContentType, fetchAllContentTypes } from './util';
import { DEFAULT_CONTENT_TYPE, DEFAULT_CONTENT_TYPE_ID } from './config';

describe('handleError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('calls setErrorMessage with the provided message', () => {
    const setErrorMessage = vi.fn();
    handleError('Something went wrong', setErrorMessage);
    expect(setErrorMessage).toHaveBeenCalledWith('Something went wrong');
  });

  it('logs the message to console.error', () => {
    const setErrorMessage = vi.fn();
    handleError('Something went wrong', setErrorMessage);
    expect(console.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('also logs error.message when an error object is provided', () => {
    const setErrorMessage = vi.fn();
    handleError('Something went wrong', setErrorMessage, new Error('Detailed error'));
    expect(console.error).toHaveBeenCalledWith('Detailed error');
  });

  it('does not throw when no error object is provided', () => {
    const setErrorMessage = vi.fn();
    expect(() => handleError('message', setErrorMessage)).not.toThrow();
  });
});

describe('createDefaultContentType', () => {
  const mockCreatedContentType = { sys: { id: DEFAULT_CONTENT_TYPE_ID } };

  const makeMockCma = () => ({
    contentType: {
      createWithId: vi.fn().mockResolvedValue(mockCreatedContentType),
      publish: vi.fn().mockResolvedValue({}),
    },
  });

  const makeMockSdk = () => ({
    ids: { space: 'space-1', environment: 'master' },
  });

  it('creates the content type with the correct space and environment IDs', async () => {
    const mockCma = makeMockCma();
    await createDefaultContentType(makeMockSdk() as any, mockCma as any);
    expect(mockCma.contentType.createWithId).toHaveBeenCalledWith(
      { spaceId: 'space-1', environmentId: 'master', contentTypeId: DEFAULT_CONTENT_TYPE_ID },
      DEFAULT_CONTENT_TYPE,
    );
  });

  it('publishes the created content type', async () => {
    const mockCma = makeMockCma();
    await createDefaultContentType(makeMockSdk() as any, mockCma as any);
    expect(mockCma.contentType.publish).toHaveBeenCalledWith({ contentTypeId: DEFAULT_CONTENT_TYPE_ID }, mockCreatedContentType);
  });

  it('returns the content type ID', async () => {
    const mockCma = makeMockCma();
    const result = await createDefaultContentType(makeMockSdk() as any, mockCma as any);
    expect(result).toBe(DEFAULT_CONTENT_TYPE_ID);
  });

  it('publishes after creating (not before)', async () => {
    const callOrder: string[] = [];
    const mockCma = {
      contentType: {
        createWithId: vi.fn().mockImplementation(async () => {
          callOrder.push('createWithId');
          return mockCreatedContentType;
        }),
        publish: vi.fn().mockImplementation(async () => {
          callOrder.push('publish');
        }),
      },
    };
    await createDefaultContentType(makeMockSdk() as any, mockCma as any);
    expect(callOrder).toEqual(['createWithId', 'publish']);
  });
});

describe('fetchAllContentTypes', () => {
  const mockItems = [{ sys: { id: 'ct1' } }, { sys: { id: 'ct2' } }];

  const makeMockCma = () => ({
    contentType: {
      getMany: vi.fn().mockResolvedValue({ items: mockItems }),
    },
  });

  it('fetches content types with the correct space and environment IDs', async () => {
    const mockCma = makeMockCma();
    const setAllContentTypes = vi.fn();
    await fetchAllContentTypes(mockCma as any, 'space-1', 'master', setAllContentTypes);
    expect(mockCma.contentType.getMany).toHaveBeenCalledWith({
      spaceId: 'space-1',
      environmentId: 'master',
    });
  });

  it('calls setAllContentTypes with the items from the response', async () => {
    const mockCma = makeMockCma();
    const setAllContentTypes = vi.fn();
    await fetchAllContentTypes(mockCma as any, 'space-1', 'master', setAllContentTypes);
    expect(setAllContentTypes).toHaveBeenCalledWith(mockItems);
  });

  it('calls setAllContentTypes with an empty array when there are no content types', async () => {
    const mockCma = {
      contentType: { getMany: vi.fn().mockResolvedValue({ items: [] }) },
    };
    const setAllContentTypes = vi.fn();
    await fetchAllContentTypes(mockCma as any, 'space-1', 'master', setAllContentTypes);
    expect(setAllContentTypes).toHaveBeenCalledWith([]);
  });
});
