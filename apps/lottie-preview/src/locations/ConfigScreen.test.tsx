import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConfigScreen from './ConfigScreen';
import { useSDK } from '@contentful/react-apps-toolkit';

// Mock the app-components package
vi.mock('@contentful/app-components', () => ({
  SelectContentTypeFields: vi.fn(() => <div data-testid="select-content-type-fields" />),
  hasJsonFields: { id: 'hasJsonFields', name: 'Has JSON fields' },
  jsonFields: { id: 'jsonFields', name: 'JSON fields' },
}));

vi.mock('@contentful/react-apps-toolkit');

const mockUseSDK = useSDK as unknown as ReturnType<typeof vi.fn>;

describe('ConfigScreen', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mockUseSDK.mockReturnValue({
      app: {
        onConfigure: vi.fn(),
        onConfigurationCompleted: vi.fn(),
        getParameters: vi.fn().mockResolvedValue({}),
        setReady: vi.fn(),
        getCurrentState: vi.fn().mockResolvedValue({}),
      },
      cma: {
        editorInterface: {
          get: vi.fn().mockResolvedValue({ controls: [] }),
          update: vi.fn().mockResolvedValue({}),
        },
      },
      ids: { app: 'app-id', space: 'space-id', environment: 'env-id' },
      notifier: {
        error: vi.fn(),
        warning: vi.fn(),
      },
    });
  });

  it('calls onConfigure when app is configured', async () => {
    const mockOnConfigure = vi.fn();
    mockUseSDK.mockReturnValue({
      app: {
        onConfigure: mockOnConfigure,
        onConfigurationCompleted: vi.fn(),
        getParameters: vi.fn().mockResolvedValue({}),
        setReady: vi.fn(),
        getCurrentState: vi.fn().mockResolvedValue({}),
      },
      cma: {
        editorInterface: {
          get: vi.fn().mockResolvedValue({ controls: [] }),
          update: vi.fn().mockResolvedValue({}),
        },
      },
      ids: { app: 'app-id', space: 'space-id', environment: 'env-id' },
      notifier: {
        error: vi.fn(),
        warning: vi.fn(),
      },
    });

    render(<ConfigScreen />);

    expect(mockOnConfigure).toHaveBeenCalled();
  });

  it('calls onConfigurationCompleted when app configuration is completed', async () => {
    const mockOnConfigurationCompleted = vi.fn();
    mockUseSDK.mockReturnValue({
      app: {
        onConfigure: vi.fn(),
        onConfigurationCompleted: mockOnConfigurationCompleted,
        getParameters: vi.fn().mockResolvedValue({}),
        setReady: vi.fn(),
        getCurrentState: vi.fn().mockResolvedValue({}),
      },
      cma: {
        editorInterface: {
          get: vi.fn().mockResolvedValue({ controls: [] }),
          update: vi.fn().mockResolvedValue({}),
        },
      },
      ids: { app: 'app-id', space: 'space-id', environment: 'env-id' },
      notifier: {
        error: vi.fn(),
        warning: vi.fn(),
      },
    });

    render(<ConfigScreen />);

    expect(mockOnConfigurationCompleted).toHaveBeenCalled();
  });

  it('sets app as ready on mount', async () => {
    const mockSetReady = vi.fn();
    mockUseSDK.mockReturnValue({
      app: {
        onConfigure: vi.fn(),
        onConfigurationCompleted: vi.fn(),
        getParameters: vi.fn().mockResolvedValue({}),
        setReady: mockSetReady,
        getCurrentState: vi.fn().mockResolvedValue({}),
      },
      cma: {
        editorInterface: {
          get: vi.fn().mockResolvedValue({ controls: [] }),
          update: vi.fn().mockResolvedValue({}),
        },
      },
      ids: { app: 'app-id', space: 'space-id', environment: 'env-id' },
      notifier: {
        error: vi.fn(),
        warning: vi.fn(),
      },
    });

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSetReady).toHaveBeenCalled();
    });
  });
});
