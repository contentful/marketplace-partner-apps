import { useSDK } from '@contentful/react-apps-toolkit';
import { AppInstallationParameters, CloudinaryAsset } from '../../types';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useMemo } from 'react';
import { Cloudinary as cloudinaryCore } from 'cloudinary-core';
import { VALID_IMAGE_FORMATS } from '../../constants';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, IconButton } from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';
import { css } from 'emotion';

const styles = {
  container: css({
    maxWidth: '600px',
  }),
  grid: css({
    display: 'grid',
    gap: '20px',
    gridTemplateColumns: 'repeat(3, 1fr)',
  }),
  card: (disabled: boolean) =>
    css({
      margin: '10px',
      position: 'relative',
      img: {
        cursor: disabled ? 'move' : 'pointer',
        display: 'block',
        maxWidth: '150px',
        maxHeight: '100px',
        margin: 'auto',
        userSelect: 'none', // Image selection sometimes makes drag and drop ugly.
      },
    }),
  remove: css({
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    backgroundColor: 'white',
    padding: 0,
    minHeight: 'initial',
  }),
};

interface Props {
  asset: CloudinaryAsset & { id: string };
  isDisabled: boolean;
  onDelete: () => void;
}

export function Thumbnail({ asset, isDisabled, onDelete }: Props) {
  const sdk = useSDK<FieldAppSDK<AppInstallationParameters>>();

  const alt = [asset.public_id, ...(asset.tags ?? [])].join(', ');
  const url = useMemo(() => getUrlFromAsset(sdk.parameters.installation, asset), [asset, sdk.parameters.installation]);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: asset.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card className={styles.card(isDisabled)} ref={setNodeRef} style={style} {...attributes}>
      {url ? <img src={url} alt={alt} {...listeners} /> : <div {...listeners}>Asset not available</div>}

      {!isDisabled && <IconButton variant="transparent" icon={<CloseIcon variant="muted" />} aria-label="Close" onClick={onDelete} className={styles.remove} />}
    </Card>
  );
}

function getUrlFromAsset(installationParams: AppInstallationParameters, asset: CloudinaryAsset): string | undefined {
  const cloudinary = new cloudinaryCore({
    cloud_name: installationParams.cloudName,
    api_key: installationParams.apiKey,
  });

  const transformations = `${asset.raw_transformation ?? ''}/c_fill,h_100,w_150`;
  if (asset.resource_type === 'image' && VALID_IMAGE_FORMATS.includes(asset.format)) {
    return cloudinary.url(asset.public_id, {
      type: asset.type,
      rawTransformation: transformations,
    });
  }
  if (asset.resource_type === 'video') {
    return cloudinary.video_thumbnail_url(asset.public_id, {
      type: asset.type,
      rawTransformation: transformations,
    });
  }
}
