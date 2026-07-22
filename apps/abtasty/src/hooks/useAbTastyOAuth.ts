import { useEffect } from 'react';

const OAUTH_ORIGIN = 'https://integrations-oauth.abtasty.com';

export function useAbTastyOAuth(onToken: (token: string) => void) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== OAUTH_ORIGIN) return;

      const data = (event as MessageEvent<any>).data;
      if (data?.type === 'ABTASTY_OAUTH_SUCCESS' && data.access_token) {
        onToken(data.access_token);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onToken]);

  const openOAuthPopup = () => {
    const width = 600;
    const height = 700;
    const name = 'abtasty_oauth';
    const url = `${OAUTH_ORIGIN}/contentful/oauth`;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      url,
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
