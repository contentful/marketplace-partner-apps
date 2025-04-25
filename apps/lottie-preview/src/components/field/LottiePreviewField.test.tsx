import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSDK } from '@contentful/react-apps-toolkit';
import LottiePreviewField from '@src/components/field/LottiePreviewField';

// Mocks
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
}));

vi.mock('@lottiefiles/dotlottie-react', () => ({
  DotLottieReact: () => <div data-testid="lottie-player">Lottie Player</div>,
}));

vi.mock('@contentful/field-editor-json', () => ({
  JsonEditor: () => <div data-testid="json-editor">JSON Editor</div>,
}));

vi.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ onMount }: any) => {
    const mockEditor = {
      getModel: () => ({
        getFullModelRange: () => ({ startLineNumber: 1, endLineNumber: 1 }),
        getValue: () => '{}',
        setValue: vi.fn(),
        pushStackElement: vi.fn(),
        canUndo: () => true,
        canRedo: () => true,
      }),
      pushUndoStop: vi.fn(),
      executeEdits: vi.fn(),
      trigger: vi.fn(),
      onDidChangeModelContent: vi.fn(),
    };
    onMount?.(mockEditor);
    return <div data-testid="monaco-editor">Editor</div>;
  },
}));

describe('LottiePreviewField', () => {
  const mockSdk = {
    window: {
      startAutoResizer: vi.fn(),
    },
    field: {
      getValue: vi.fn(),
      onValueChanged: vi.fn(),
      setValue: vi.fn(),
    },
  };

  const mockJson = { v: '5.5.7', fr: 30, ip: 0, op: 60 };
  const mockChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useSDK as any).mockReturnValue(mockSdk);
  });

  it('renders without crashing', () => {
    render(<LottiePreviewField lottieJson={mockJson} onLottieJsonChange={mockChange} />);
    expect(screen.getByText('Undo')).toBeTruthy();
    expect(screen.getByText('Redo')).toBeTruthy();
    expect(screen.getByTestId('monaco-editor')).toBeTruthy();
  });

  it('initializes with correct SDK setup', () => {
    render(<LottiePreviewField lottieJson={mockJson} onLottieJsonChange={mockChange} />);
    expect(mockSdk.window.startAutoResizer).toHaveBeenCalled();
    expect(mockSdk.field.getValue).toHaveBeenCalled();
    expect(mockSdk.field.onValueChanged).toHaveBeenCalled();
  });

  it('renders Lottie player when JSON data is available', () => {
    render(<LottiePreviewField lottieJson={mockJson} onLottieJsonChange={mockChange} />);
    expect(screen.getByTestId('lottie-player')).toBeTruthy();
  });

  it('still renders Lottie player when no JSON is available', () => {
    render(<LottiePreviewField lottieJson={{}} onLottieJsonChange={mockChange} />);
    expect(screen.getByTestId('lottie-player')).toBeTruthy();
  });

  it('clears JSON when Clear is clicked', () => {
    render(<LottiePreviewField lottieJson={mockJson} onLottieJsonChange={mockChange} />);
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    expect(mockSdk.field.setValue).toHaveBeenCalledWith({});
    expect(mockChange).toHaveBeenCalledWith({});
  });

  it('opens and closes the JSON modal', () => {
    render(<LottiePreviewField lottieJson={mockJson} onLottieJsonChange={mockChange} />);
    const modalOpen = screen.getByLabelText('preview-lottie-json');
    fireEvent.click(modalOpen);
    expect(screen.getByText('Lottie Preview - JSON editor')).toBeTruthy();
  });

  it('handles undo and redo button clicks', () => {
    render(<LottiePreviewField lottieJson={mockJson} onLottieJsonChange={mockChange} />);
    const undoBtn = screen.getByText('Undo');
    const redoBtn = screen.getByText('Redo');
    fireEvent.click(undoBtn);
    fireEvent.click(redoBtn);
    expect(mockSdk.field.setValue).toHaveBeenCalledTimes(0); // no update from mocked editor
  });
});
