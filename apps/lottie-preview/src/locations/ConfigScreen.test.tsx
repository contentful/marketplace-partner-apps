import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConfigScreen from './ConfigScreen';
import { useSDK } from '@contentful/react-apps-toolkit';

// Mock the app-components package
vi.mock('@contentful/app-components', () => ({
  SelectContentTypeFields: vi.fn(({ selectedFieldIds, onSelectionChange, renderEmptyState }) => {
    return (
      <div data-testid="select-content-type-fields">
        <input data-testid="field-selector-input" placeholder="Select content types and JSON fields..." />
        <div data-testid="selected-fields">
          {selectedFieldIds.map((id: string) => (
            <div key={id} data-testid={`selected-field-${id}`}>
              {id}
            </div>
          ))}
        </div>
        {selectedFieldIds.length === 0 && renderEmptyState && renderEmptyState()}
      </div>
    );
  }),
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

  it('renders the main headings', async () => {
    render(<ConfigScreen />);

    const heading = screen.getByText(/Set up Lottie Preview/);
    expect(heading).toBeTruthy();
    expect(heading.textContent).toContain('Set up Lottie Preview');
  });

  it('renders the SelectContentTypeFields component', async () => {
    render(<ConfigScreen />);

    const fieldSelector = screen.getByTestId('select-content-type-fields');
    expect(fieldSelector).toBeTruthy();
  });

  it('shows empty state when no fields are selected', async () => {
    render(<ConfigScreen />);

    const emptyState = screen.getByText(/There are no JSON object field types to select/i);
    expect(emptyState).toBeTruthy();
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
