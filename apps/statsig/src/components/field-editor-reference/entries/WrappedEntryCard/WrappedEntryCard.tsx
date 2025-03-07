import * as React from 'react';

import { SpaceAPI } from '@contentful/app-sdk';
import { EntryCard, MenuItem, MenuDivider, Badge } from '@contentful/f36-components';
import { Entry, File } from '@contentful/field-editor-reference';
import { entityHelpers, isValidImage } from '@contentful/field-editor-shared';

import { AssetThumbnail, MissingEntityCard, EntityStatusBadge } from '../../components';
import { SpaceName } from '../../components/SpaceName/SpaceName';
import { ContentType, RenderDragFn } from '../../types';

const { getEntryTitle, getEntityDescription, getEntityStatus, getEntryImage } = entityHelpers;

export interface WrappedEntryCardProps {
  getEntityScheduledActions: SpaceAPI['getEntityScheduledActions'];
  getAsset: (assetId: string) => Promise<unknown>;
  size: 'small' | 'default' | 'auto';
  isDisabled: boolean;
  localeCode: string;
  defaultLocaleCode: string;
  entry: Entry;
  hasCardEditActions: boolean;

  // optional
  contentType?: ContentType;
  entryUrl?: string;
  hasCardMoveActions?: boolean;
  hasCardRemoveActions?: boolean;
  isClickable?: boolean;
  isLocalized?: boolean;
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onEdit?: () => void;
  onMoveBottom?: () => void;
  onMoveTop?: () => void;
  onRemove?: () => void;
  renderDragHandle?: RenderDragFn;
  spaceName?: string;
  useLocalizedEntityStatus?: boolean;
}

export function WrappedEntryCard({
  contentType,
  defaultLocaleCode,
  entry,
  entryUrl,
  getAsset,
  getEntityScheduledActions,
  isDisabled,
  isLocalized,
  isSelected,
  localeCode,
  onClick,
  onEdit,
  onMoveBottom,
  onMoveTop,
  onRemove,
  renderDragHandle,
  size,
  spaceName,
  useLocalizedEntityStatus,
  isClickable = true,
  hasCardEditActions = true,
  hasCardMoveActions = true,
  hasCardRemoveActions = true,
}: WrappedEntryCardProps) {
  const [file, setFile] = React.useState<null | File>(null);

  React.useEffect(() => {
    if (entry) {
      getEntryImage(
        {
          entry,
          contentType,
          localeCode,
          defaultLocaleCode,
        },
        getAsset,
      )
        .then((file) => setFile(file))
        .catch(() => {
          setFile(null);
        });
    }
  }, [entry, getAsset, contentType, localeCode, defaultLocaleCode]);

  const status = getEntityStatus(entry?.sys, useLocalizedEntityStatus ? localeCode : undefined);

  if (status === 'deleted') {
    return (
      <MissingEntityCard isDisabled={isDisabled} onRemove={onRemove} providerName="Contentful" />
    );
  }

  const title = getEntryTitle({
    entry,
    contentType,
    localeCode,
    defaultLocaleCode,
    defaultTitle: 'Untitled',
  });

  const description = getEntityDescription({
    entity: entry,
    contentType,
    localeCode,
    defaultLocaleCode,
  });

  return (
    <EntryCard
      as={entryUrl ? 'a' : 'article'}
      href={entryUrl}
      title={title}
      description={description}
      contentType={contentType?.name}
      size={size}
      isSelected={isSelected}
      badge={
        <EntityStatusBadge
          status={status}
          entityId={entry.sys.id}
          entityType="Entry"
          getEntityScheduledActions={getEntityScheduledActions}
        />
      }
      icon={
        spaceName ? (
          <SpaceName spaceName={spaceName} environmentName={entry.sys.environment.sys.id} />
        ) : !isLocalized && useLocalizedEntityStatus ? (
          <Badge variant="secondary">Default</Badge>
        ) : null
      }
      thumbnailElement={file && isValidImage(file) ? <AssetThumbnail file={file} /> : undefined}
      dragHandleRender={renderDragHandle}
      withDragHandle={!!renderDragHandle}
      actions={
        onEdit || onRemove
          ? [
              hasCardEditActions && onEdit ? (
                <MenuItem
                  key="edit"
                  testId="edit"
                  onClick={() => {
                    onEdit && onEdit();
                  }}
                >
                  Edit
                </MenuItem>
              ) : null,
              hasCardRemoveActions && onRemove ? (
                <MenuItem
                  key="delete"
                  testId="delete"
                  onClick={() => {
                    onRemove && onRemove();
                  }}
                >
                  Remove
                </MenuItem>
              ) : null,
              hasCardMoveActions && (onMoveTop || onMoveBottom) ? (
                <MenuDivider key="divider" />
              ) : null,
              hasCardMoveActions && onMoveTop ? (
                <MenuItem key="move-top" onClick={() => onMoveTop && onMoveTop()} testId="move-top">
                  Move to top
                </MenuItem>
              ) : null,
              hasCardMoveActions && onMoveBottom ? (
                <MenuItem
                  key="move-bottom"
                  onClick={() => onMoveBottom && onMoveBottom()}
                  testId="move-bottom"
                >
                  Move to bottom
                </MenuItem>
              ) : null,
            ].filter((item) => item)
          : []
      }
      onClick={
        // Providing an onClick handler messes up with some rich text
        // features e.g. pressing ENTER on a card to add a new paragraph
        // underneath. It's crucial not to pass a custom handler when
        // isClickable is disabled which in the case of RT it's.
        isClickable
          ? (e: React.MouseEvent<HTMLElement>) => {
              e.preventDefault();
              if (onClick) return onClick(e);
              onEdit && onEdit();
            }
          : undefined
      }
    />
  );
}
