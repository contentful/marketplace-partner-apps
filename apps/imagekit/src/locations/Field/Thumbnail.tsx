import { AssetCard, DateTime, DragHandle, Menu, MenuDivider, MenuItem } from '@contentful/f36-components';
import { ExternalLinkIcon, DeleteIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import fileSize from 'file-size';
import { ImageKitAsset } from '../../types';
import { DEFAULT_INTEGRATION_PARAMETERS } from '../../constants';

interface Props {
  asset: ImageKitAsset & { id: string };
  isDisabled: boolean;
  onDelete: () => void;
}

export function Thumbnail({ asset, isDisabled, onDelete }: Props) {
  const alt = [asset.name, ...(asset.tags ?? [])].join(', ');
  const url = asset.thumbnail || asset.url;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: asset.id });
  const consoleUrl = `https://imagekit.io/dashboard/media-library/detail/${asset.fileId}`;
  const filePath = asset?.filePath?.replace(asset.name, '');
  const folderUrl = `https://imagekit.io/dashboard/media-library/${filePath !== "/" ? btoa(filePath) : ''}`;

  return (
    <div ref={setNodeRef}>
      <AssetCard
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          width: '100%',
          maxWidth: '225px',
        }}
        dragHandleRender={() => (
          <DragHandle 
            as="button" 
            style={{ alignSelf: 'stretch' }} 
            label="Move card" 
            {...attributes} 
            {...listeners} 
          />
        )}
        withDragHandle={!isDisabled}
        src={url}
        title={alt}
        type="image"
        icon={<img src={DEFAULT_INTEGRATION_PARAMETERS.logo} alt="" width={20} height={20} />}
        size="small"
        actions={[
          <MenuItem 
            key="view-on-imagekit" 
            as="a" 
            href={consoleUrl} 
            target="_blank" 
            onClick={() => window.open(consoleUrl, "_blank")}
            style={{ fill: tokens.gray900 }}
          >
            <img src={DEFAULT_INTEGRATION_PARAMETERS.logo} alt="" width={15} height={15} /> View on ImageKit
          </MenuItem>,
          <MenuItem 
            key="live-preview" 
            as="a" 
            href={asset.url} 
            target="_blank" 
            onClick={() => window.open(asset.url, "_blank")}
            style={{ fill: tokens.gray900 }}
          >
            <ExternalLinkIcon /> Preview in New Tab
          </MenuItem>,
          <MenuItem key="remove" onClick={onDelete} isDisabled={isDisabled}>
            <DeleteIcon /> Remove
          </MenuItem>,
          <MenuDivider key="divider" />,
          <Menu.SectionTitle key="file-information-title">File information</Menu.SectionTitle>,
          <MenuItem 
            key="file-information" 
            isDisabled 
            style={{ opacity: 1 }}
          >
            <dl style={{
              backgroundColor: tokens.gray100,
              borderRadius: tokens.borderRadiusMedium,
              padding: tokens.spacingXs,
              width: '200px',
              lineHeight: tokens.lineHeightS,
              fontSize: tokens.fontSizeS,
            }}>
              <dt style={{
                color: tokens.gray700,
                marginRight: tokens.spacingXs,
                paddingTop: tokens.spacing2Xs,
                paddingBottom: tokens.spacing2Xs,
                float: 'left',
                clear: 'left',
              }}>File path:</dt>
              <dd style={{
                marginLeft: 0,
                color: tokens.gray900,
                paddingTop: tokens.spacing2Xs,
                paddingBottom: tokens.spacing2Xs,
              }}>
                <a href={folderUrl} target="_blank" rel="noopener noreferrer" style={{
                  color: tokens.gray900,
                  textDecoration: 'underline',
                }}>
                  {filePath}
                </a>
              </dd>
              
              {asset.fileType && (
                <>
                  <dt style={{
                    color: tokens.gray700,
                    marginRight: tokens.spacingXs,
                    paddingTop: tokens.spacing2Xs,
                    paddingBottom: tokens.spacing2Xs,
                    float: 'left',
                    clear: 'left',
                  }}>Format:</dt>
                  <dd style={{
                    marginLeft: 0,
                    color: tokens.gray900,
                    paddingTop: tokens.spacing2Xs,
                    paddingBottom: tokens.spacing2Xs,
                  }}>{asset.name.split('.').pop()?.toUpperCase() || 'Unknown'}</dd>
                </>
              )}

              {asset.imagekitId && (
                <>
                  <dt style={{
                    color: tokens.gray700,
                    marginRight: tokens.spacingXs,
                    paddingTop: tokens.spacing2Xs,
                    paddingBottom: tokens.spacing2Xs,
                    float: 'left',
                    clear: 'left',
                  }}>ImageKit ID:</dt>
                  <dd style={{
                    marginLeft: 0,
                    color: tokens.gray900,
                    paddingTop: tokens.spacing2Xs,
                    paddingBottom: tokens.spacing2Xs,
                  }}>{asset.imagekitId}</dd>
                </>
              )}
              
              <dt style={{
                color: tokens.gray700,
                marginRight: tokens.spacingXs,
                paddingTop: tokens.spacing2Xs,
                paddingBottom: tokens.spacing2Xs,
                float: 'left',
                clear: 'left',
              }}>Size:</dt>
              <dd style={{
                marginLeft: 0,
                color: tokens.gray900,
                paddingTop: tokens.spacing2Xs,
                paddingBottom: tokens.spacing2Xs,
              }}>{fileSize(asset.size).human('jedec')}</dd>
              
              {asset.width && asset.height && (
                <>
                  <dt style={{
                    color: tokens.gray700,
                    marginRight: tokens.spacingXs,
                    paddingTop: tokens.spacing2Xs,
                    paddingBottom: tokens.spacing2Xs,
                    float: 'left',
                    clear: 'left',
                  }}>Dimensions:</dt>
                  <dd style={{
                    marginLeft: 0,
                    color: tokens.gray900,
                    paddingTop: tokens.spacing2Xs,
                    paddingBottom: tokens.spacing2Xs,
                  }}>
                    {asset.width} x {asset.height} px
                  </dd>
                </>
              )}
              
              <dt style={{
                color: tokens.gray700,
                marginRight: tokens.spacingXs,
                paddingTop: tokens.spacing2Xs,
                paddingBottom: tokens.spacing2Xs,
                float: 'left',
                clear: 'left',
              }}>Created on:</dt>
              <dd style={{
                marginLeft: 0,
                color: tokens.gray900,
                paddingTop: tokens.spacing2Xs,
                paddingBottom: tokens.spacing2Xs,
              }}>
                <DateTime date={asset.createdAt} format="day" />
              </dd>

              <dt style={{
                color: tokens.gray700,
                marginRight: tokens.spacingXs,
                paddingTop: tokens.spacing2Xs,
                paddingBottom: tokens.spacing2Xs,
                float: 'left',
                clear: 'left',
              }}>Private file:</dt>
              <dd style={{
                marginLeft: 0,
                color: tokens.gray900,
                paddingTop: tokens.spacing2Xs,
                paddingBottom: tokens.spacing2Xs,
              }}>
                {asset.isPrivateFile ? 'Yes' : 'No'}
              </dd>

              <dt style={{
                color: tokens.gray700,
                marginRight: tokens.spacingXs,
                paddingTop: tokens.spacing2Xs,
                paddingBottom: tokens.spacing2Xs,
                float: 'left',
                clear: 'left',
              }}>Published:</dt>
              <dd style={{
                marginLeft: 0,
                color: tokens.gray900,
                paddingTop: tokens.spacing2Xs,
                paddingBottom: tokens.spacing2Xs,
              }}>
                {asset.isPublished ? 'Yes' : 'No'}
              </dd>
            </dl>
          </MenuItem>,
        ]}
      />
    </div>
  );
}
