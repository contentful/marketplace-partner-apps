import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ApiKeyTab } from './ApiKeyTab';

describe('ApiKeyTab', () => {
  const mockSetParameters = vi.fn();
  const mockParameters = {
    apiKey: '',
    styleGuideId: '',
  };

  it('renders the API key input field', () => {
    render(<ApiKeyTab parameters={mockParameters} setParameters={mockSetParameters} />);

    expect(screen.getByPlaceholderText('Enter your API key')).toBeInTheDocument();
    expect(screen.getByText('API Key')).toBeInTheDocument();
  });

  it('renders help text', () => {
    render(<ApiKeyTab parameters={mockParameters} setParameters={mockSetParameters} />);

    expect(screen.getByText(/Don't have an API key\?/)).toBeInTheDocument();
  });

  it('displays existing API key value', () => {
    const parametersWithKey = {
      ...mockParameters,
      apiKey: 'existing-key',
    };

    render(<ApiKeyTab parameters={parametersWithKey} setParameters={mockSetParameters} />);

    const input = screen.getByPlaceholderText('Enter your API key');
    expect(input).toHaveValue('existing-key');
  });
});
