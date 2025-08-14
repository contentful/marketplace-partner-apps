import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { CxProgressBar } from '@/web-component';

type Props = {
  url: string;
  thumbnailUrl?: string;
  onError: () => void;
  loaded: boolean;
  onLoaded: () => void;
};

const ViewPreview: FC<Props> = ({
  url,
  thumbnailUrl,
  onError,
  loaded,
  onLoaded,
}) => {
  const [assetDirection, setAssetDirection] = useState<'vertical' | 'horizontal'>('horizontal');
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<CxProgressBar>(null);

  useEffect(() => {
    const container = containerRef.current?.parentElement;
    const video = videoRef.current;
    const progressBar = progressBarRef.current;

    if (!container || !video || !progressBar) {
      return;
    }

    const updateVideoProgress = (e: MouseEvent) => {
      if (video.duration && e.currentTarget === container) {
        progressBar.value = (e.offsetX / container.offsetWidth) * 100;
        video.currentTime =
          (e.offsetX / container.offsetWidth) * video.duration;
      }
    };

    const onMouseEnter = (e: MouseEvent) => {
      e.stopImmediatePropagation();
      updateVideoProgress(e);
    };

    const onMouseLeave = (e: MouseEvent) => {
      e.stopImmediatePropagation();
      progressBar.value = 0;
      video.currentTime = 0;
      video.pause();
    };

    const onMouseMove = (e: MouseEvent) => {
      e.stopImmediatePropagation();
      updateVideoProgress(e);
    };

    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('mousemove', onMouseMove);

    return () => {
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('mousemove', onMouseMove);
    };
  }, [thumbnailUrl]);

  const onLoadAsset = useCallback(() => {
    onLoaded();

    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      setAssetDirection(videoWidth > videoHeight ? 'horizontal' : 'vertical');
    }

    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setAssetDirection(naturalWidth > naturalHeight ? 'horizontal' : 'vertical');
    }
  }, [onLoaded]);

  return (
    <>
      <div
        className={`asset-preview__representative asset-preview__representative--${assetDirection}`}
      >
        <video
          ref={videoRef}
          src={url}
          onLoadedMetadata={onLoadAsset}
          onError={() => {
            onError();
          }}
        >
          <track default kind="captions" srcLang="en" />
        </video>
      </div>
      <cx-progress-bar
        ref={progressBarRef}
        class="asset-preview__progress-bar"
      ></cx-progress-bar>
      <div ref={containerRef} className="asset-preview__representative-overlay"></div>
    </>
  );
};

export default ViewPreview;
