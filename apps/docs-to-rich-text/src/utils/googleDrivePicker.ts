import { GoogleDrivePickerResult } from '../types';

export async function launchGoogleDrivePicker(): Promise<GoogleDrivePickerResult> {
  return new Promise((resolve, reject) => {
    const popupWidth = 500;
    const popupHeight = 600;

    // Fixes dual-screen position                             Most browsers      Firefox
    const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

    const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    const systemZoom = width / window.screen.availWidth;
    const left = (width - popupWidth) / 2 / systemZoom + dualScreenLeft;
    const top = (height - popupHeight) / 2 / systemZoom + dualScreenTop;

    let isSettled = false;

    // Open the popup in the center of the screen
    const popup = window.open(
      'https://ellavationlabs.com/docs-to-rich-text/google-oauth.html',
      'Google Drive',
      `width=${popupWidth},height=${popupHeight},top=${top},left=${left}`,
    );

    if (!popup) {
      return reject(new Error('Failed to open popup'));
    }

    const interval = setInterval(() => {
      if (popup.closed && !isSettled) {
        clearInterval(interval);
        reject(new Error('Popup closed by user'));
      }
    }, 500);

    window.addEventListener('message', function onMessage(event) {
      if (event.origin !== 'https://ellavationlabs.com') {
        return; // Ignore messages from unexpected origins
      }

      isSettled = true;

      if (event.data.success === true) {
        clearInterval(interval);
        window.removeEventListener('message', onMessage);
        popup.close();
        resolve({
          html: event.data.html,
          markdown: event.data.markdown,
        });
      } else if (event.data.success === false) {
        clearInterval(interval);
        window.removeEventListener('message', onMessage);
        popup.close();
        reject(new Error(event.data.error));
      }
    });
  });
}
