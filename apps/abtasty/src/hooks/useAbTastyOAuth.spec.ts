import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAbTastyOAuth } from './useAbTastyOAuth';
import { OAUTH_ORIGIN } from '@/constants';

const postMessageToWindow = (data: unknown, origin: string) => {
  window.dispatchEvent(new MessageEvent('message', { data, origin }));
};

const successMessage = { type: 'ABTASTY_OAUTH_SUCCESS', access_token: 'token-123' };

describe('useAbTastyOAuth', () => {
  let onToken: Mock<(token: string) => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    onToken = vi.fn<(token: string) => void>();
  });

  it('accepts a token posted from the AB Tasty OAuth origin', () => {
    renderHook(() => useAbTastyOAuth(onToken));

    postMessageToWindow(successMessage, OAUTH_ORIGIN);

    expect(onToken).toHaveBeenCalledWith('token-123');
  });

  it('ignores a token posted from any other origin', () => {
    renderHook(() => useAbTastyOAuth(onToken));

    postMessageToWindow({ ...successMessage, access_token: 'attacker-token' }, 'https://evil.example.com');
    postMessageToWindow({ ...successMessage, access_token: 'attacker-token' }, 'null');
    postMessageToWindow({ ...successMessage, access_token: 'attacker-token' }, 'https://abtasty.com');
    postMessageToWindow({ ...successMessage, access_token: 'attacker-token' }, `${OAUTH_ORIGIN}.evil.com`);

    expect(onToken).not.toHaveBeenCalled();
  });

  it('ignores messages from the OAuth origin that do not carry a token', () => {
    renderHook(() => useAbTastyOAuth(onToken));

    postMessageToWindow({ type: 'ABTASTY_OAUTH_SUCCESS' }, OAUTH_ORIGIN);
    postMessageToWindow({ type: 'ABTASTY_OAUTH_SUCCESS', access_token: '' }, OAUTH_ORIGIN);
    postMessageToWindow({ type: 'ABTASTY_OAUTH_ERROR', access_token: 'token-123' }, OAUTH_ORIGIN);
    postMessageToWindow('ABTASTY_OAUTH_SUCCESS', OAUTH_ORIGIN);
    postMessageToWindow(null, OAUTH_ORIGIN);

    expect(onToken).not.toHaveBeenCalled();
  });

  it('stops listening once unmounted', () => {
    const { unmount } = renderHook(() => useAbTastyOAuth(onToken));

    unmount();
    postMessageToWindow(successMessage, OAUTH_ORIGIN);

    expect(onToken).not.toHaveBeenCalled();
  });
});
