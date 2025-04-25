import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSDK } from '@contentful/react-apps-toolkit';
import Field from './Field';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
}));

vi.mock('@src/components/field/LottiePreviewField', () => ({
  __esModule: true,
  default: ({ lottieJson }: { lottieJson: any }) => <div data-testid="lottie-preview-field">{JSON.stringify(lottieJson)}</div>,
}));

describe('Field', () => {
  const mockSdk = {
    window: {
      startAutoResizer: vi.fn(),
    },
    field: {
      getValue: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSDK as any).mockReturnValue(mockSdk);
  });

  it('calls sdk methods on mount', () => {
    mockSdk.field.getValue.mockReturnValue({ v: '5.5.7', fr: 30 });
    render(<Field />);
    expect(mockSdk.window.startAutoResizer).toHaveBeenCalled();
    expect(mockSdk.field.getValue).toHaveBeenCalled();
  });

  it('renders LottiePreviewField with value from SDK', () => {
    const testJson = { v: '5.5.7', fr: 24, ip: 0, op: 60 };
    mockSdk.field.getValue.mockReturnValue(testJson);

    render(<Field />);
    expect(screen.getByTestId('lottie-preview-field')).toBeTruthy();
  });

  it('renders LottiePreviewField with empty object if getValue is null', () => {
    mockSdk.field.getValue.mockReturnValue(null);
    render(<Field />);
    expect(screen.getByTestId('lottie-preview-field').textContent).toBe('{}');
  });
});
