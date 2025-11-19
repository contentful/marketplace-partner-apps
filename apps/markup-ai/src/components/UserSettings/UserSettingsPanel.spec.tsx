import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils/testUtils';
import UserSettingsPanel from './UserSettingsPanel';

vi.mock('@contentful/react-apps-toolkit', () => ({ useSDK: vi.fn(() => ({})) }));

describe('UserSettingsPanel', () => {
  const baseProps = {
    isOpen: true,
    forceOpen: false,
    onClose: vi.fn(),
    apiKey: 'k',
    dialect: null as string | null,
    tone: null as string | null,
    styleGuide: null as string | null,
    onDialectChange: vi.fn(),
    onToneChange: vi.fn(),
    onStyleGuideChange: vi.fn(),
  };

  it('renders when open and shows configuration tab', () => {
    render(<UserSettingsPanel {...baseProps} />);
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });

  it('does not render when not open and not forced', () => {
    const { container } = render(<UserSettingsPanel {...baseProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('blocks closing when config incomplete (no callback called)', () => {
    const onClose = vi.fn();
    render(<UserSettingsPanel {...baseProps} onClose={onClose} />);
    const closeBtn = screen.getByLabelText('Close settings');
    fireEvent.click(closeBtn);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes when config is complete without requiring tone', () => {
    const onClose = vi.fn();
    render(<UserSettingsPanel {...baseProps} onClose={onClose} dialect="en-US" tone={null} styleGuide="default" />);
    const closeBtn = screen.getByLabelText('Close settings');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
