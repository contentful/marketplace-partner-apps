import { mockCma } from './mockCma'
import { vi } from 'vitest'
import { ConfigAppSDK } from '@contentful/app-sdk'

export const mockSdk = {
  app: {
    onConfigure: vi.fn(),
    onConfigurationCompleted: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn().mockResolvedValue(undefined),
    getCurrentState: vi.fn(),
    isInstalled: vi.fn(),
  },
  ids: {
    app: 'test-app',
    environment: 'test-env',
  },
  cma: mockCma,
  hostnames: {
    webapp: 'app.contentful.com',
  },
} as unknown as ConfigAppSDK
