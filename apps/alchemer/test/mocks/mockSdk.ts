import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: 'test-app',
    space: 'test-space',
    environment: 'master',
  },
  field: {
    // Field type must be Object or the component renders a misconfiguration
    // error instead of the picker UI.
    type: 'Object',
    getValue: vi.fn(),
    setValue: vi.fn(),
    removeValue: vi.fn(),
    onValueChanged: vi.fn().mockReturnValue(() => undefined),
  },
  window: {
    startAutoResizer: vi.fn(),
    stopAutoResizer: vi.fn(),
  },
  notifier: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
  cma: {
    appActionCall: {
      createWithResponse: vi.fn().mockResolvedValue({
        response: { body: JSON.stringify({ ok: true, surveys: [], page: 1, totalPages: 1 }) },
      }),
    },
  },
};

export { mockSdk };
