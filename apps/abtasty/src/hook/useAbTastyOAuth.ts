import { useEffect } from 'react';

export function useAbTastyOAuth(onToken: (token: string) => void) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
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
    const url = 'https://integrations-oauth.abtasty.com/contentful/oauth';
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
