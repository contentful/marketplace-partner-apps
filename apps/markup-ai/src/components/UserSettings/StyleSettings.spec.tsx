import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../../../test/utils/testUtils';
import StyleSettings from './StyleSettings';

vi.mock('../../services/apiService', () => ({
  fetchAdminConstants: vi.fn(),
  fetchStyleGuides: vi.fn(),
}));

import { fetchAdminConstants, fetchStyleGuides } from '../../services/apiService';

describe('StyleSettings', () => {
  const constants = { dialects: ['en-US', 'en-GB'], tones: ['neutral', 'formal'] };
  const styleGuides = [{ id: 'default', name: 'Default' }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseProps = {
    apiKey: 'k',
    dialect: null as string | null,
    tone: null as string | null,
    styleGuide: null as string | null,
    onDialectChange: vi.fn(),
    onToneChange: vi.fn(),
    onStyleGuideChange: vi.fn(),
  };

  it('shows spinner while loading and then renders selects', async () => {
    (fetchAdminConstants as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(constants);
    (fetchStyleGuides as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(styleGuides);
    render(<StyleSettings {...baseProps} />);

    // Spinner from f36 uses data-test-id
    expect(document.querySelector('[data-test-id="cf-ui-spinner"]')).not.toBeNull();
    await waitFor(() => expect(screen.getByText('Dialect')).toBeInTheDocument());
    expect(screen.getByText('Tone')).toBeInTheDocument();
    expect(screen.getByText('Style Guide')).toBeInTheDocument();
  });

  it('renders error Note when API fails', async () => {
    (fetchAdminConstants as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('x'));
    (fetchStyleGuides as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('x'));
    render(<StyleSettings {...baseProps} />);
    await waitFor(() => expect(screen.getByText('Error')).toBeInTheDocument());
    expect(screen.getByText('Failed to load settings options')).toBeInTheDocument();
  });

  it('triggers onSaveAndClose when complete', async () => {
    (fetchAdminConstants as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(constants);
    (fetchStyleGuides as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(styleGuides);

    const onSaveAndClose = vi.fn();
    render(
      <StyleSettings
        {...baseProps}
        dialect="en-US"
        tone="neutral"
        styleGuide="default"
        onSaveAndClose={onSaveAndClose}
      />,
    );
    await waitFor(() => screen.getByText('Dialect'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSaveAndClose).toHaveBeenCalledTimes(1);
  });
});
