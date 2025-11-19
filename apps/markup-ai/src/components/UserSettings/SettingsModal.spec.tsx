import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils/testUtils';
import SettingsModal from './SettingsModal';

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Ensure react-modal internal timeouts are executed before jsdom teardown
    vi.runAllTimers();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    apiKey: 'k',
    dialect: 'en-US',
    tone: 'neutral',
    styleGuide: 'default',
    onApiKeyClear: vi.fn(),
    onApiKeyChange: vi.fn(),
    onDialectChange: vi.fn(),
    onToneChange: vi.fn(),
    onStyleGuideChange: vi.fn(),
  };

  it('renders modal content and controls', () => {
    const { unmount } = render(<SettingsModal {...baseProps} />);
    expect(screen.getByText('User Settings')).toBeInTheDocument();
    expect(
      screen.getByText('Configure your preferences. These are stored locally in your browser.'),
    ).toBeInTheDocument();
    expect(screen.getByText('API Key')).toBeInTheDocument();
    expect(screen.getByText('Save API Key')).toBeInTheDocument();
    expect(screen.getByText('Clear API Key')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    unmount();
  });

  it('updates API key input and triggers save handler', () => {
    const { unmount } = render(<SettingsModal {...baseProps} />);
    const input = screen.getByPlaceholderText('Enter your API key');
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.click(screen.getByText('Save API Key'));
    expect(baseProps.onApiKeyChange).toHaveBeenCalledWith('abc');
    unmount();
  });

  it('calls clear and close handlers', () => {
    const { unmount } = render(<SettingsModal {...baseProps} />);
    fireEvent.click(screen.getByText('Clear API Key'));
    expect(baseProps.onApiKeyClear).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Done'));
    expect(baseProps.onClose).toHaveBeenCalled();
    unmount();
  });
});
