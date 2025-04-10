import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSDK } from '@contentful/react-apps-toolkit';
import Field from './Field';

// Mock the required dependencies
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
}));

vi.mock('@lottiefiles/dotlottie-react', () => ({
  DotLottieReact: () => <div data-testid="lottie-player">Lottie Player</div>,
}));

vi.mock('@contentful/field-editor-json', () => ({
  JsonEditor: () => <div data-testid="json-editor">JSON Editor</div>,
}));

describe('Field Component', () => {
  const mockSdk = {
    window: {
      startAutoResizer: vi.fn(),
    },
    field: {
      getValue: vi.fn(),
      onValueChanged: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSDK as any).mockReturnValue(mockSdk);
  });

  it('renders without crashing', () => {
    render(<Field />);
    expect(screen.getByText('Undo')).toBeTruthy();
    expect(screen.getByText('Redo')).toBeTruthy();
  });

  it('initializes with correct SDK setup', () => {
    render(<Field />);
    expect(mockSdk.window.startAutoResizer).toHaveBeenCalled();
    expect(mockSdk.field.getValue).toHaveBeenCalled();
    expect(mockSdk.field.onValueChanged).toHaveBeenCalled();
  });

  it('renders Lottie player when JSON data is available', () => {
    const mockLottieData = { some: 'data' };
    mockSdk.field.getValue.mockReturnValue(mockLottieData);
    
    render(<Field />);
    expect(screen.getByTestId('lottie-player')).toBeTruthy();
  });

  it('still render Lottie player when no JSON data is available', () => {
    mockSdk.field.getValue.mockReturnValue(null);
    
    render(<Field />);
    expect(screen.queryByTestId('lottie-player')).toBeTruthy();
  });
}); 