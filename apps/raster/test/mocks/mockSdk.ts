import { vi } from 'vitest';
import type { DialogAppSDK } from '@contentful/app-sdk';
import type { Image } from '@/lib/types';

const defaultMockSdk = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  window: {
    startAutoResizer: vi.fn(),
  },
  field: {
    getValue: vi.fn(),
    setValue: vi.fn(),
  },
  ids: {
    app: 'test-app',
  },
} as unknown as DialogAppSDK;

const mockSdkWithImage = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  window: {
    startAutoResizer: vi.fn(),
  },
  field: {
    getValue: (): Image[] => [
      {
        id: '1',
        url: 'https://example.com/image.jpg',
        name: 'Barcelona Beach',
        blurhash: 'UUKJMXx',
        description: 'Barcelona Beach at sunset',
        height: '1080',
        width: '1920',
        libraryId: 'barcelona',
        thumbUrl: 'https://example.com/image-thumb.jpg',
        thumbUrlBlurred: 'https://example.com/image-thumb-blurred.jpg',
        type: 'image',
        views: undefined,
        parentId: undefined,
      },
    ],
    setValue: vi.fn(),
  },
  ids: {
    app: 'test-app',
  },
} as unknown as DialogAppSDK;

const mockDialog = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  window: {
    startAutoResizer: vi.fn(),
  },
  ids: {
    app: 'test-app',
  },
  parameters: {
    installation: {
      orgId: 'org-id',
      apiKey: 'api-key',
    },
    invocation: {
      currentValue: [
        {
          id: '1',
          url: 'https://example.com/image.jpg',
          name: 'Barcelona Beach',
          blurhash: 'UUKJMXx',
          description: 'Barcelona Beach at sunset',
          height: '1080',
          width: '1920',
          libraryId: 'barcelona',
          thumbUrl: 'https://example.com/image-thumb.jpg',
          thumbUrlBlurred: 'https://example.com/image-thumb-blurred.jpg',
          type: 'image',
          views: undefined,
          parentId: undefined,
        },
      ],
    },
  },
} as unknown as DialogAppSDK;

export { mockDialog, defaultMockSdk, mockSdkWithImage };
