import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConfigScreen from './ConfigScreen';
import { useJsonFieldsState } from '@src/hooks/useJsonFieldsState';
import { useSDK } from '@contentful/react-apps-toolkit';

vi.mock('@src/hooks/useJsonFieldsState');
vi.mock('@contentful/react-apps-toolkit');

vi.mock('@src/configUtils', async (importOriginal) => {
  return {
    getJsonFields: vi.fn().mockResolvedValue([
      {
        contentTypeId: 'blogPost',
        contentTypeName: 'Blog Post',
        fieldId: 'lottie',
        fieldName: 'Lottie',
        isEnabled: true,
        originalEnabled: true,
      },
    ]),
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
    mockUseJsonFieldsState.mockReturnValue({
      jsonFields: mockFields,
      jsonFieldsRef: { current: mockFields },
      updateField,
      initialize,
      resetOriginalState,
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
  });

  it('renders the main headings', () => {
    render(<ConfigScreen />);

    const heading = screen.getByText(/Set up Lottie Preview/);
    expect(heading).not.toBeNull();
    expect(heading.textContent).toContain('Set up Lottie Preview');
  });

  it('renders field pills for enabled fields', () => {
    render(<ConfigScreen />);

    const pill = document.querySelector('[data-test-id="pill-lottie"]');
    expect(pill).toBeTruthy();
    expect(pill?.textContent).toContain('Blog Post > Lottie');
  });

  it('calls updateField when a checkbox is toggled', async () => {
    render(<ConfigScreen />);

    const checkbox = document.querySelector('[data-test-id="checkbox-lottie"]');
    expect(checkbox).toBeTruthy();

    await userEvent.click(checkbox!);

    expect(updateField).toHaveBeenCalledWith('blogPost', 'lottie', { isEnabled: false });
  });

  it('calls updateField when pill close is clicked', async () => {
    render(<ConfigScreen />);
    const pill = document.querySelector('[data-test-id="pill-lottie"]');
    expect(pill).toBeTruthy();

    const closeButton = pill?.querySelector('button');
    expect(closeButton).toBeTruthy();

    await userEvent.click(closeButton!);

    expect(updateField).toHaveBeenCalledWith('blogPost', 'lottie', { isEnabled: false });
  });

  it('disables Autocomplete when no JSON fields are available', () => {
    mockUseJsonFieldsState.mockReturnValue({
      jsonFields: [],
      jsonFieldsRef: { current: [] },
      updateField,
      initialize,
      resetOriginalState,
    });

    render(<ConfigScreen />);

    const input = screen.getByRole('textbox');
    expect((input as HTMLInputElement).disabled).toBe(true);
  });

  it('shows empty state note when there are no JSON fields', () => {
    mockUseJsonFieldsState.mockReturnValue({
      jsonFields: [],
      jsonFieldsRef: { current: [] },
      updateField,
      initialize,
      resetOriginalState,
    });

    render(<ConfigScreen />);

    expect(screen.getByText(/There are no JSON object field types to select/i)).toBeTruthy();
  });
});
