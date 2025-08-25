import { FC, useMemo } from 'react';

type Props = {
  alt: string;
  url: string;
  onError: () => void;
  onLoaded: () => void;
};

/**
 * This list taken from https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types
 */
export const ALLOWED_IMAGE_EXTENSIONS = [
  'jpg',
  'apng',
  'avif',
  'gif',
  'jpeg',
  'jfif',
  'pjpeg',
  'pjp',
  'png',
  'svg',
  'webp'
];

const ImagePreview: FC<Props> = ({
  alt,
  url,
  onError,
  onLoaded,
}) => {
  /**
   * HTML Image Element can only display certain image extensions (ALLOWED_IMAGE_EXTENSIONS).
   * We need to ensure the image URL has a valid extension by replacing it with a default one if necessary.
   * The DAM (Digital Asset Management) will handle the actual image processing if the requested extension changed.
   */
  const imageUrl = useMemo(() => {
    const imageExtension = /\.(?<Extension>\w{3,4})($|\?)/?.exec(url)?.groups?.Extension
    if (!imageExtension || !ALLOWED_IMAGE_EXTENSIONS.includes(imageExtension)) {
      return url.replace(/\.(?<Extension>\w{3,4})(?<Params>$|\?)/, (_match: string, _extension: string, param?: string) => "." + ALLOWED_IMAGE_EXTENSIONS[0] + param);
    }
    return url;
  }, [url]);

  return (
    <cx-image
      class="asset-preview__representative"
      src={imageUrl}
      alt={alt}
      onLoad={onLoaded}
      onError={onError}
      object-fit="contain"
    />
  );
};

export default ImagePreview;