import { FieldAppSDK } from '@contentful/app-sdk';
import { AssetCard, DateTime, DragHandle, Menu, MenuDivider, MenuItem } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Cloudinary as cloudinaryCore } from 'cloudinary-core';
import { css } from 'emotion';
import { useMemo } from 'react';
import logo from '../../assets/logo.svg';
import { VALID_IMAGE_FORMATS } from '../../constants';
import { AppInstallationParameters, CloudinaryAsset } from '../../types';
import fileSize from 'file-size';

const styles = {
  dragHandle: css({
    alignSelf: 'stretch',
  }),
  fileInformation: {
    menuItem: css({
      opacity: 1,
    }),
    dl: css({
      backgroundColor: tokens.gray100,
      borderRadius: tokens.borderRadiusMedium,
      padding: tokens.spacingXs,
      width: '200px',
      lineHeight: tokens.lineHeightS,
      fontSize: tokens.fontSizeS,

      dt: {
        color: tokens.gray700,
        marginRight: tokens.spacingXs,
        paddingTop: tokens.spacing2Xs,
        paddingBottom: tokens.spacing2Xs,
        float: 'left',
        clear: 'left',
      },
      dd: {
        marginLeft: 0,
        color: tokens.gray900,
        paddingTop: tokens.spacing2Xs,
        paddingBottom: tokens.spacing2Xs,
      },
    }),
  },
  menuItemIcon: css({
    fill: tokens.gray900,
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

  const consoleUrl = `https://console.cloudinary.com/console/media_library/query_search?q=${encodeURIComponent(
    `{"userExpression":"(public_id = \\"${asset.public_id}\\")"}`,
  )}`;

  return (
    <div ref={setNodeRef}>
      <AssetCard
        style={style}
        dragHandleRender={() => <DragHandle as="button" className={styles.dragHandle} label="Move card" {...attributes} {...listeners} />}
        withDragHandle={!isDisabled}
        src={url}
        title={alt}
        type="image"
        icon={<img src={logo} alt="" width={24} height={24} />}
        size="small"
        actions={[
          <MenuItem key="edit" as="a" href={consoleUrl} target="_blank" onClick={() => window.open(consoleUrl, "_blank")}>
            Edit in Cloudinary <ExternalLinkIcon className={styles.menuItemIcon} />
          </MenuItem>,
          <MenuItem key="remove" onClick={onDelete} isDisabled={isDisabled}>
            Remove
          </MenuItem>,
          <MenuDivider key="divider" />,
          <Menu.SectionTitle key="file-information-title">File information</Menu.SectionTitle>,
          <MenuItem key="file-information" className={styles.fileInformation.menuItem} isDisabled>
            <dl className={styles.fileInformation.dl}>
              <dt>Location:</dt>
              <dd>{asset.public_id.split('/').slice(0, -1).join('/') || 'Home'}</dd>
              <dt>Format:</dt>
              <dd>{asset.format}</dd>
              <dt>Size:</dt>
              <dd>{fileSize(asset.bytes).human('jedec')}</dd>
              <dt>Dimensions:</dt>
              <dd>
                {asset.width} x {asset.height} px
              </dd>
              <dt>Created on:</dt>
              <dd>
                <DateTime date={asset.created_at} format="day" />
              </dd>
            </dl>
          </MenuItem>,
        ]}
      />
    </div>
  );
}

function getUrlFromAsset(installationParams: AppInstallationParameters, asset: CloudinaryAsset): string | undefined {
  const cloudinary = new cloudinaryCore({
    cloud_name: installationParams.cloudName,
    api_key: installationParams.apiKey,
  });

  const transformations = `${asset.raw_transformation ?? ''}/c_crop,h_300,w_300`;
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
