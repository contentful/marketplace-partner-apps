import { vi } from 'vitest';
import type { DialogAppSDK } from '@contentful/app-sdk';
import type { Image } from '@/lib/types';

// As the field has always stored it, so entries saved before the picker are covered.
const storedImage: Image = {
  id: '1',
  blurhash: 'UUKJMXx',
  thumbUrl: 'https://example.com/image-thumb.jpg',
  url: 'https://example.com/image.jpg',
  name: 'Barcelona Beach',
  height: 1080,
  width: 1920,
  views: [],
  description: 'Barcelona Beach at sunset',
};

const defaultMockSdk = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  notifier: {
    error: vi.fn(),
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
    getValue: (): Image[] => [storedImage],
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
  close: vi.fn(),
  notifier: {
    warning: vi.fn(),
  },
  ids: {
    app: 'test-app',
    space: 'test-space',
    user: 'test-user',
  },
  parameters: {
    installation: {
      orgId: ' org-id ',
      apiKey: 'api-key',
    },
    invocation: {
      currentValue: [storedImage],
    },
  },
} as unknown as DialogAppSDK;

export { mockDialog, defaultMockSdk, mockSdkWithImage, storedImage };
