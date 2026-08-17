import { useEffect } from 'react';
import { OAUTH_ORIGIN, OAUTH_URL } from '@/constants';

interface OAuthSuccessMessage {
  type: 'ABTASTY_OAUTH_SUCCESS';
  access_token: string;
}

function isOAuthSuccessMessage(data: unknown): data is OAuthSuccessMessage {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const { type, access_token } = data as Record<string, unknown>;
  return type === 'ABTASTY_OAUTH_SUCCESS' && typeof access_token === 'string' && access_token.length > 0;
}

export function useAbTastyOAuth(onToken: (token: string) => void) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only trust token when it comes from the AB Tasty OAuth origin.
      if (event.origin !== OAUTH_ORIGIN) {
        return;
      }

      if (isOAuthSuccessMessage(event.data)) {
        onToken(event.data.access_token);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onToken]);

  const openOAuthPopup = () => {
    const width = 600;
    const height = 700;
    const name = 'abtasty_oauth';
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      OAUTH_URL,
      name,
      `width=${width},height=${height},top=${top},left=${left},resizable,scrollbars=yes`
    );
    if (!popup) {
      console.error('Popup blocked or failed to open');
      return;
    }
    popup.focus();
  };

  return { openOAuthPopup };
}
