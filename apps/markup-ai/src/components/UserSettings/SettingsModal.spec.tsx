import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils/testUtils';
import SettingsModal from './SettingsModal';

describe('SettingsModal', () => {
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
    render(<SettingsModal {...baseProps} />);
    expect(screen.getByText('User Settings')).toBeInTheDocument();
    expect(
      screen.getByText('Configure your preferences. These are stored locally in your browser.'),
    ).toBeInTheDocument();
    expect(screen.getByText('API Key')).toBeInTheDocument();
    expect(screen.getByText('Save API Key')).toBeInTheDocument();
    expect(screen.getByText('Clear API Key')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('updates API key input and triggers save handler', () => {
    render(<SettingsModal {...baseProps} />);
    const input = screen.getByPlaceholderText('Enter your API key') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.click(screen.getByText('Save API Key'));
    expect(baseProps.onApiKeyChange).toHaveBeenCalledWith('abc');
  });

  it('calls clear and close handlers', () => {
    render(<SettingsModal {...baseProps} />);
    fireEvent.click(screen.getByText('Clear API Key'));
    expect(baseProps.onApiKeyClear).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Done'));
    expect(baseProps.onClose).toHaveBeenCalled();
  });
});
