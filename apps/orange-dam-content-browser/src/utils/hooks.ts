import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useMemo, useState } from "react";
import WebFont from 'webfontloader';

export const useDesignSystem = () => {
  useEffect(() => {
    WebFont.load({
      google: {
        families: [
          'Fira Code',
          'Fira Mono',
          'Fira Sans',
          'Fira Sans Condensed',
          'Fira Sans Extra Condensed',
        ],
      },
    });

    const script = document.createElement('script');
    script.src = 'https://design-system.orangelogic.com/entry.1.0.212.js';
    script.type = 'module';
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
    
  }, []);
}

export const useGetFileInfoFromUrl = (url: string) => {
  const [assetType, setAssetType] = useState<"image" | "video" | "unknown">("unknown");
  const [fileName, setFileName] = useState<string>('');
  const [contentType, setContentType] = useState<string>('');

  useEffect(() => {
    // Reset state when URL changes
    setAssetType("unknown");
    setFileName('');
    setContentType('');

    fetch(url, { method: 'HEAD' }).then(response  => {
      const contentType = response.headers.get('Content-Type') || '';
      const contentDisposition = response.headers.get('Content-Disposition') || '';

      // Determine file type
      if (contentType.startsWith('image/')) setAssetType('image');
      else if (contentType.startsWith('video/')) setAssetType('video');
      else setAssetType('unknown');

      // Attempt to get filename from Content-Disposition
      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]*)["']?/i);
      if (match && match[1]) {
        setFileName(decodeURIComponent(match[1]));
      } else {
        // Fallback to extracting from URL
        const urlPath = new URL(url).pathname;
        setFileName(urlPath.substring(urlPath.lastIndexOf('/') + 1));
      }
      setContentType(contentType);
    });
  }, [url]);

  return { contentType, assetType, fileName };
}

/**
 * Hook to read global configuration for OrangeDAMContentBrowser from Contentful App SDK.
 * Returns the configuration object, or undefined if not available.
 * Configuration in instance parameters will override the installation parameters.
 */
export const useDefaultCBSConfig = (): Partial<OrangeDAMContentBrowserConfig> => {
  const sdk = useSDK();

  return useMemo(() => {
    const installation = sdk.parameters.installation || {};
    const instance = sdk.parameters.instance || {};
    return { ...installation, ...instance }
  }, [sdk] );
};