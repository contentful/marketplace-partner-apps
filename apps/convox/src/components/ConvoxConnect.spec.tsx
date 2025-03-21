import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ConvoxConnect from './ConvoxConnect';

// Mock debounce function
vi.mock('lodash.debounce', () => {
  return {
    // eslint-disable-next-line
    default: (fn: (...args: any[]) => any) => fn,
  };
});

describe('ConvoxConnect', () => {
  const mockUpdateConvoxDeployKey = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders with initial deploy key value', () => {
    const initialKey = 'initial-deploy-key';
    render(
      <ConvoxConnect
        convoxDeployKey={initialKey}
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={true}
        hasAuthError={false}
      />
    );

    const input = screen.getByLabelText('Convox Deploy Key') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe(initialKey);
    expect(input.type).toBe('password');
  });

  it('updates input value when prop changes', () => {
    const { rerender } = render(
      <ConvoxConnect
        convoxDeployKey="1234567"
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={true}
        hasAuthError={false}
      />
    );

    const input = screen.getByLabelText('Convox Deploy Key') as HTMLInputElement;
    expect(input.value).toBe('1234567');

    rerender(
      <ConvoxConnect
        convoxDeployKey="5678910"
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={true}
        hasAuthError={false}
      />
    );

    expect(input.value).toBe('5678910');
  });

  it('calls updateconvoxDeployKey when input changes', () => {
    render(
      <ConvoxConnect
        convoxDeployKey=""
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={true}
        hasAuthError={false}
      />
    );

    const input = screen.getByLabelText('Convox Deploy Key');
    fireEvent.change(input, { target: { value: 'new-deploy-key' } });

    expect(mockUpdateConvoxDeployKey).toHaveBeenCalledWith('new-deploy-key');
  });

  it('shows validation message when authentication fails', () => {
    render(
      <ConvoxConnect
        convoxDeployKey="1234567"
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={false}
        hasAuthError={true}
      />
    );

    const validationMessage = screen.getByText('Invalid Deploy Key.');
    expect(validationMessage).toBeTruthy();

    const input = screen.getByLabelText('Convox Deploy Key');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('does not show validation message when authenticated', () => {
    render(
      <ConvoxConnect
        convoxDeployKey="1234567"
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={true}
        hasAuthError={false}
      />
    );

    const validationMessage = screen.queryByText('Invalid Deploy Key.');
    expect(validationMessage).toBeNull();
  });

  it('does not show validation message when not authenticated but no auth error', () => {
    render(
      <ConvoxConnect
        convoxDeployKey=""
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={false}
        hasAuthError={false}
      />
    );

    const validationMessage = screen.queryByText('Invalid Deploy Key.');
    expect(validationMessage).toBeNull();
  });

  it('renders help text correctly', () => {
    render(
      <ConvoxConnect
        convoxDeployKey=""
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={true}
        hasAuthError={false}
      />
    );

    const helpText = screen.getByText(/Deploy Keys can be generated from the/i);
    expect(helpText).toBeTruthy();

    const strongElement = screen.getByText('Settings');
    expect(strongElement).toBeTruthy();
    expect(strongElement.tagName).toBe('STRONG');
  });
});
