// useAbTastyOAuth.spec.ts
import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAbTastyOAuth } from './useAbTastyOAuth';

describe('useAbTastyOAuth', () => {
  let onToken: (token: string) => void;

  beforeEach(() => {
    onToken = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const postMessage = (origin: string, data: unknown) => {
    window.dispatchEvent(new MessageEvent('message', { data, origin }));
  };

  it('accepts a token from the AB Tasty OAuth origin', () => {
    renderHook(() => useAbTastyOAuth(onToken));

    postMessage('https://integrations-oauth.abtasty.com', {
      type: 'ABTASTY_OAUTH_SUCCESS',
      access_token: 'valid-token',
    });

    expect(onToken).toHaveBeenCalledWith('valid-token');
  });

  it('ignores a token from an untrusted origin', () => {
    renderHook(() => useAbTastyOAuth(onToken));

    postMessage('https://attacker.example', {
      type: 'ABTASTY_OAUTH_SUCCESS',
      access_token: 'malicious-token',
    });

    expect(onToken).not.toHaveBeenCalled();
  });

  it('ignores messages from an untrusted origin even with a matching message type and shape', () => {
    renderHook(() => useAbTastyOAuth(onToken));

    postMessage('https://evil.abtasty.com.attacker.example', {
      type: 'ABTASTY_OAUTH_SUCCESS',
      access_token: 'spoofed-token',
    });

    expect(onToken).not.toHaveBeenCalled();
  });
});
