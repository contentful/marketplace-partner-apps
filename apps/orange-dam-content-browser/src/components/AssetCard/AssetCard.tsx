import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CxCard } from '@/web-component';

import { getValueByKeyCaseInsensitive } from '@/utils/tools';
import AssetPreview from '../AssetPreview';
import { Card } from './AssetCard.styled';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { MediaType } from '@/types';

type Props = {
  asset: OrangeDamAssetInfo;
  isLoading: boolean;
  onItemRemove: () => void;
  onMount?: (id: string) => void;
  onLoaded?: (id: string) => void;
};

const AssetCard: FC<Props> = ({
  asset,
  isLoading,
  onItemRemove,
  onMount,
  onLoaded,
}) => {
  const sdk = useSDK<FieldAppSDK>();
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<CxCard>(null);

  useEffect(() => {
    if (!isLoading) {
      setImageLoaded(false);
    }
  }, [isLoading])

  const extraFields = useMemo<MappedExtraField>(() => !!asset.extraFields ? {
    title: getValueByKeyCaseInsensitive("CoreField.TitleWithFallback", asset.extraFields, ""),
    thumbnailUrl: getValueByKeyCaseInsensitive("CoreField.LargeSizePreview", asset.extraFields, ""),
    docType: getValueByKeyCaseInsensitive("CoreField.DocType", asset.extraFields, ""),
    id: getValueByKeyCaseInsensitive("Document.Identifier", asset.extraFields, ""),
    extension: getValueByKeyCaseInsensitive("CoreField.Extension", asset.extraFields, ""),
    scrubUrl: getValueByKeyCaseInsensitive("ScrubUrl", asset.extraFields, ""),
  } : {
    title: "Untitled",
    id: "",
    docType: MediaType.Multimedia,
  }, [asset.extraFields]);

  const previewLoaded = imageLoaded || (extraFields.docType !== MediaType.Image && extraFields.docType !== MediaType.Video);
  const onPreviewLoaded = useCallback(() => {
    setImageLoaded(true);
    if (onLoaded) {
      onLoaded(extraFields.id);
    }
  }, [extraFields.id, onLoaded]);

  useEffect(() => {
    if (onMount) {
      onMount(extraFields.id);
    }
  }, [onMount, extraFields.id]);

  const viewMetadata = () => {
    sdk.dialogs.openCurrentApp({
      parameters: {
        initiator: "asset-card",
        ...asset
      },
      position: "center",
      width: 'large',
      minHeight: "40vh",
      shouldCloseOnEscapePress: true,
      shouldCloseOnOverlayClick: true,
      title: `Asset Metadata - ${extraFields.title}`,
    });
  };

  return (
    <Card
      ref={cardRef}
      className="asset-card asset-card--small w-3xs"
      data-testid="asset-card"
    >
      <AssetPreview
        slot="image"
        extraFields={extraFields}
        imageLoaded={previewLoaded}
        onLoaded={onPreviewLoaded}
        url={!extraFields.scrubUrl ? asset.imageUrl : extraFields.scrubUrl}
        thumbnailUrl={extraFields.thumbnailUrl}
        data-testid="asset-preview"
      />
      <div slot="image" className="asset-card__delete">
        <cx-icon-button 
          onClick={() => onItemRemove && onItemRemove()} 
          name="cancel" 
          size="small"
          data-testid="remove-asset-button"
        ></cx-icon-button>
      </div>
      <cx-space>
        <div className="flex items-center gap-1 w-full">
          <cx-tooltip content={extraFields?.title} placement="bottom" distance="8" skidding="0" trigger="hover focus" hoist>
            <span className="flex-1 min-w-0 truncate" data-testid="asset-title">
              {extraFields?.title}
            </span>
          </cx-tooltip>
          <cx-icon-button
            className="shrink-0"
            onClick={viewMetadata}
            name="info"
            size="small"
          ></cx-icon-button>
        </div>
      </cx-space>
    </Card>
  );
};

export default AssetCard;
