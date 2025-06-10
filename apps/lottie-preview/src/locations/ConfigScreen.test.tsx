import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConfigScreen from './ConfigScreen';
import { useJsonFieldsState } from '@src/hooks/useJsonFieldsState';
import { useSDK } from '@contentful/react-apps-toolkit';
import { getContentTypesWithJsonFieldsCount, getJsonFields } from '@src/configUtils';

vi.mock('@src/hooks/useJsonFieldsState');
vi.mock('@contentful/react-apps-toolkit');

vi.mock('@src/configUtils', async () => {
  return {
    getJsonFields: vi.fn().mockResolvedValue({
      fields: [
        {
          contentTypeId: 'blogPost',
          contentTypeName: 'Blog Post',
          fieldId: 'lottie',
          fieldName: 'Lottie',
          isEnabled: true,
          originalEnabled: true,
        },
      ],
      totalContentTypes: 1,
      processedContentTypes: 1,
      hasMore: false,
    }),
    getContentTypesWithJsonFieldsCount: vi.fn().mockResolvedValue(1),
    groupFieldsByContentType: vi.fn().mockReturnValue({}),
    buildEditorInterfaceControls: vi.fn().mockReturnValue([]),
  };
});

const mockUseJsonFieldsState = useJsonFieldsState as unknown as ReturnType<typeof vi.fn>;
const mockUseSDK = useSDK as unknown as ReturnType<typeof vi.fn>;

describe('ConfigScreen (no jest-dom)', () => {
  const mockFields = [
    {
      contentTypeId: 'blogPost',
      contentTypeName: 'Blog Post',
      fieldId: 'lottie',
      fieldName: 'Lottie',
      isEnabled: true,
      originalEnabled: true,
    },
  ];

  const updateField = vi.fn();
  const initialize = vi.fn();
  const resetOriginalState = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    mockUseJsonFieldsState.mockReturnValue({
      jsonFields: mockFields,
      jsonFieldsRef: { current: mockFields },
      updateField,
      initialize,
      resetOriginalState,
      version: 0,
    });

    mockUseSDK.mockReturnValue({
      app: {
        onConfigure: vi.fn(),
        onConfigurationCompleted: vi.fn(),
        getParameters: vi.fn().mockResolvedValue({}),
        setReady: vi.fn(),
      },
      cma: {},
      ids: { app: 'app-id', space: 'space-id', environment: 'env-id' },
    });

    // Reset mocks to default behavior
    (getContentTypesWithJsonFieldsCount as any).mockResolvedValue(1);
    (getJsonFields as any).mockResolvedValue({
      fields: mockFields,
      totalContentTypes: 1,
      processedContentTypes: 1,
      hasMore: false,
    });
  });

  it('renders the main headings', async () => {
    render(<ConfigScreen />);

    const heading = screen.getByText(/Set up Lottie Preview/);
    expect(heading).not.toBeNull();
    expect(heading.textContent).toContain('Set up Lottie Preview');

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeTruthy();
    });
  });

  it('renders field pills for enabled fields', async () => {
    render(<ConfigScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeTruthy();
    });

    const pill = document.querySelector('[data-test-id="pill-lottie"]');
    expect(pill).toBeTruthy();
    expect(pill?.textContent).toContain('Blog Post > Lottie');
  });

  it('calls updateField when a checkbox is toggled', async () => {
    render(<ConfigScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeTruthy();
    });

    const checkbox = document.querySelector('[data-test-id="checkbox-lottie"]');
    expect(checkbox).toBeTruthy();

    await userEvent.click(checkbox!);

    expect(updateField).toHaveBeenCalledWith('blogPost', 'lottie', { isEnabled: false });
  });

  it('calls updateField when pill close is clicked', async () => {
    render(<ConfigScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeTruthy();
    });

    const pill = document.querySelector('[data-test-id="pill-lottie"]');
    expect(pill).toBeTruthy();

    const closeButton = pill?.querySelector('button');
    expect(closeButton).toBeTruthy();

    await userEvent.click(closeButton!);

    expect(updateField).toHaveBeenCalledWith('blogPost', 'lottie', { isEnabled: false });
  });

  it('disables Autocomplete when no JSON fields are available', async () => {
    mockUseJsonFieldsState.mockReturnValue({
      jsonFields: [],
      jsonFieldsRef: { current: [] },
      updateField,
      initialize,
      resetOriginalState,
      version: 0,
    });

    // Mock empty results
    (getJsonFields as any).mockResolvedValue({
      fields: [],
      totalContentTypes: 0,
      processedContentTypes: 0,
      hasMore: false,
    });

    render(<ConfigScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeTruthy();
    });

    const input = screen.getByRole('textbox');
    expect((input as HTMLInputElement).disabled).toBe(true);
  });

  it('shows empty state note when there are no JSON fields', async () => {
    mockUseJsonFieldsState.mockReturnValue({
      jsonFields: [],
      jsonFieldsRef: { current: [] },
      updateField,
      initialize,
      resetOriginalState,
      version: 0,
    });

    // Mock empty results
    (getJsonFields as any).mockResolvedValue({
      fields: [],
      totalContentTypes: 0,
      processedContentTypes: 0,
      hasMore: false,
    });

    render(<ConfigScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText(/There are no JSON object field types to select/i)).toBeTruthy();
    });
  });

  describe('loading behavior', () => {
    it('shows normal loading for small content models (<=50 content types)', async () => {
      // Mock small content model (1 content type)
      (getContentTypesWithJsonFieldsCount as any).mockResolvedValue(1);

      // Mock getJsonFields to complete quickly without progress callback
      (getJsonFields as any).mockResolvedValue({
        fields: mockFields,
        totalContentTypes: 1,
        processedContentTypes: 1,
        hasMore: false,
      });

      render(<ConfigScreen />);

      // For small content models, should use default Contentful loading (no custom UI)
      // The app should complete loading quickly and show the final UI
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeTruthy();
      });

      // Should not show custom loading UI messages
      expect(screen.queryByText(/Processing content types:/)).toBeNull();
      expect(screen.queryByText(/Scanning.*content types with JSON fields/)).toBeNull();
    });

    it('shows custom loading UI for large content models (>50 content types)', async () => {
      // Mock large content model (100 content types)
      (getContentTypesWithJsonFieldsCount as any).mockResolvedValue(100);

      // Create a controlled promise for getJsonFields
      let resolveGetJsonFields: (value: any) => void;
      let progressCallback: ((processed: number, total: number) => void) | undefined;

      const getJsonFieldsPromise = new Promise((resolve) => {
        resolveGetJsonFields = resolve;
      });

      (getJsonFields as any).mockImplementation(async (cma: any, appId: any, options: any, onProgress: any) => {
        progressCallback = onProgress;
        // Call initial progress immediately
        if (onProgress) {
          onProgress(0, 100);
        }
        return getJsonFieldsPromise;
      });

      render(<ConfigScreen />);

      // Should show initial progress UI (since onProgress is called immediately)
      await waitFor(() => {
        const elements = screen.getAllByText((content, element) => {
          return element?.textContent === 'Loading content types';
        });
        expect(elements.length).toBeGreaterThan(0);
      });

      // Simulate progress update
      if (progressCallback) {
        progressCallback(50, 100);
      }

      // Should show progress updates
      await waitFor(() => {
        const elements = screen.getAllByText((content, element) => {
          return element?.textContent === 'Loading content types';
        });
        expect(elements.length).toBeGreaterThan(0);
      });

      // Complete the loading
      resolveGetJsonFields!({
        fields: mockFields,
        totalContentTypes: 100,
        processedContentTypes: 100,
        hasMore: false,
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeTruthy();
      });
    });
  });
});
