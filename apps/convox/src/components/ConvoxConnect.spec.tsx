import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import ConvoxConnect from './ConvoxConnect';

// Mock the debounce function
vi.mock('lodash.debounce', () => {
  return {
    default: <T extends (...args: unknown[]) => unknown>(fn: T): T => fn,
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
    const { container } = render(
      <ConvoxConnect
        convoxDeployKey={initialKey}
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={true}
        hasAuthError={false}
      />
    );

    const input = container.querySelector('input[type="password"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe(initialKey);
  });

  it('updates input value when prop changes', () => {
    const { rerender, container } = render(
      <ConvoxConnect
        convoxDeployKey="1234567"
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={true}
        hasAuthError={false}
      />
    );

    const input = container.querySelector('input[type="password"]') as HTMLInputElement;
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
    const { container } = render(
      <ConvoxConnect
        convoxDeployKey=""
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={true}
        hasAuthError={false}
      />
    );

    const input = container.querySelector('input[type="password"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new-deploy-key' } });

    expect(mockUpdateConvoxDeployKey).toHaveBeenCalledWith('new-deploy-key');
  });

  it('shows validation message when authentication fails', () => {
    const { container } = render(
      <ConvoxConnect
        convoxDeployKey="1234567"
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={false}
        hasAuthError={true}
      />
    );
    const validationMessage = Array.from(container.querySelectorAll('p')).find(
      p => p.textContent === 'Invalid Deploy Key.'
    );
    expect(validationMessage).toBeTruthy();

    const input = container.querySelector('input[type="password"]') as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('does not show validation message when authenticated', () => {
    const { container } = render(
      <ConvoxConnect
        convoxDeployKey="1234567"
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={true}
        hasAuthError={false}
      />
    );

    const validationMessage = Array.from(container.querySelectorAll('p')).find(
      p => p.textContent === 'Invalid Deploy Key.'
    );
    expect(validationMessage).toBeUndefined();
  });

  it('does not show validation message when not authenticated but no auth error', () => {
    const { container } = render(
      <ConvoxConnect
        convoxDeployKey=""
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={false}
        hasAuthError={false}
      />
    );

    const validationMessage = Array.from(container.querySelectorAll('p')).find(
      p => p.textContent === 'Invalid Deploy Key.'
    );
    expect(validationMessage).toBeUndefined();
  });

  it('renders help text and links correctly', () => {
    const { container } = render(
      <ConvoxConnect
        convoxDeployKey=""
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={true}
        hasAuthError={false}
      />
    );

    const links = container.querySelectorAll('a');
    expect(links.length).toBe(3);

    let hasConsoleLink = false;
    let hasDocumentationLink = false;
    let hasAcademyLink = false;

    links.forEach(link => {
      const text = link.textContent || '';
      if (text.includes('Convox Console')) hasConsoleLink = true;
      if (text.includes('Convox Documentation')) hasDocumentationLink = true;
      if (text.includes('Convox Academy Playlist')) hasAcademyLink = true;
    });

    expect(hasConsoleLink).toBe(true);
    expect(hasDocumentationLink).toBe(true);
    expect(hasAcademyLink).toBe(true);

    const paragraphs = container.querySelectorAll('p');
    let hasDeployKeyText = false;
    let hasSettingsText = false;

    paragraphs.forEach(p => {
      const strongElements = p.querySelectorAll('strong');
      strongElements.forEach(strong => {
        if (strong.textContent === 'Deploy Key') hasDeployKeyText = true;
        if (strong.textContent === 'Settings') hasSettingsText = true;
      });
    });

    expect(hasDeployKeyText).toBe(true);
    expect(hasSettingsText).toBe(true);
  });

  it('renders with the correct styling', () => {
    const { container } = render(
      <ConvoxConnect
        convoxDeployKey=""
        updateconvoxDeployKey={mockUpdateConvoxDeployKey}
        isAuthenticated={true}
        hasAuthError={false}
      />
    );

    const helpTextElements = container.querySelectorAll('div');

    let helpCardFound = false;
    helpTextElements.forEach(div => {
      if (div.querySelectorAll('p').length >= 2) {
        helpCardFound = true;
      }
    });

    expect(helpCardFound).toBe(true);

    const links = container.querySelectorAll('a');
    expect(links.length).toBe(3);

    links.forEach(link => {
      expect(link.getAttribute('href')).toBeTruthy();
    });
  });
});
