import { FC, useCallback, useState } from 'react';

import { Container } from './AssetPreview.styled';
import ImagePreview from './ImagePreview';
import OtherPreview from './OtherPreview';
import VideoPreview from './VideoPreview';
import { MediaType } from '@/types';

type Props = {
  url: string;
  slot: string;
  extraFields: MappedExtraField;
  thumbnailUrl?: string;
  imageLoaded: boolean;
  onLoaded: () => void;
};

/**
 * This component renders a preview of an asset based on its type.
 * It supports images, videos, and other file types.
 * 
 * For Images, it uses the `ImagePreview` component.
 * - All images links used for previewing
 * - If file extension aren't support by the browser will be replaced with a jpg.
 * 
 * @param Props parameters 
 * @returns 
 */
const AssetPreview: FC<Props> = ({
  url,
  slot,
  extraFields,
  thumbnailUrl,
  imageLoaded, 
  onLoaded,
}) => {
  const [isError, setIsError] = useState(false);

  const renderPreview = useCallback(() => {
    const isUrlFilled = typeof url === 'string' && url.length > 0;

    if (!isError && isUrlFilled) {
      if (extraFields.docType === MediaType.Image) {
        return (
          <ImagePreview
            alt={extraFields.title}
            url={url}
            onLoaded={onLoaded}
            onError={() => setIsError(true)}
          />
        );
      }

      if (extraFields.docType === MediaType.Video) {
        return (
          <VideoPreview
            url={url}
            thumbnailUrl={thumbnailUrl}
            loaded={imageLoaded}
            onLoaded={onLoaded}
            onError={() => setIsError(true)}
          />
        );
      }
    }

    return (
      <OtherPreview docType={extraFields.docType}>
        {extraFields.extension?.toUpperCase() || extraFields.docType}
      </OtherPreview>
    );
  }, [url, isError, onLoaded, imageLoaded]);

  return (
    <Container slot={slot} className="asset-preview">
      {
        !imageLoaded && (
          <cx-skeleton
            slot="image"
            class="asset-preview__image-skeleton"
          ></cx-skeleton>
        )
      }
      {renderPreview()}
    </Container>
  );
};

export default AssetPreview;
