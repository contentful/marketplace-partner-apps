import * as React from 'react';

import { EditorAppSDK } from '@contentful/app-sdk';
import { EntryCard } from '@contentful/f36-components';
import {
  ContentType,
  CustomEntityCardProps,
  Entry,
  MissingEntityCard,
  RenderCustomMissingEntityCard,
  RenderDragFn,
  useEntity,
  useEntityLoader,
  WrappedEntryCard,
} from '@contentful/field-editor-reference';
import get from 'lodash/get';

import { ReferenceEditorProps } from '../field-editor-reference/common/ReferenceEditor';
import { LinkActionsProps } from '../field-editor-reference/components';
import { WrappedEntryCardProps } from '../field-editor-reference/entries/WrappedEntryCard/WrappedEntryCard';

export type EntryCardReferenceEditorProps = Omit<ReferenceEditorProps, 'sdk'> & {
  sdk: EditorAppSDK;
  entryId: string;
  index?: number;
  allContentTypes: ContentType[];
  isDisabled: boolean;
  onRemove: () => void;
  renderDragHandle?: RenderDragFn;
  hasCardEditActions: boolean;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  renderCustomMissingEntityCard?: RenderCustomMissingEntityCard;
  isBeingDragged?: boolean;
};

async function openEntry(sdk: EditorAppSDK, entryId: string) {
  const result = await sdk.navigator.openEntry(entryId, {
    slideIn: true,
  });
  return result.slide;
}

export function FetchingWrappedEntryCard(props: EntryCardReferenceEditorProps) {
  const { data: entry, status } = useEntity<Entry>('Entry', props.entryId);
  const { getEntityScheduledActions } = useEntityLoader();
  const loadEntityScheduledActions = React.useCallback(
    () => getEntityScheduledActions('Entry', props.entryId),
    [getEntityScheduledActions, props.entryId],
  );

  const size = props.viewType === 'link' ? 'small' : 'default';
  const { getEntity } = useEntityLoader();
  const getAsset = (assetId: string) => getEntity('Asset', assetId);

  const onEdit = async () => {
    const slide = await openEntry(props.sdk, props.entryId);
    props.onAction &&
      props.onAction({
        entity: 'Entry',
        type: 'edit',
        id: props.entryId,
        contentTypeId: get(entry, 'sys.contentType.sys.id'),
        slide,
      });
  };

  const onRemoveEntry = () => {
    props.onRemove();
    props.onAction &&
      props.onAction({
        entity: 'Entry',
        type: 'delete',
        id: props.entryId,
        contentTypeId: get(entry, 'sys.contentType.sys.id'),
      });
  };

  React.useEffect(() => {
    if (entry) {
      props.onAction && props.onAction({ type: 'rendered', entity: 'Entry' });
    }
    // eslint-disable-next-line  -- TODO: Evaluate the dependencies
  }, [entry]);

  return React.useMemo(() => {
    if (status === 'error') {
      const card = (
        <MissingEntityCard
          isDisabled={props.isDisabled}
          onRemove={onRemoveEntry}
          providerName="Contentful"
        />
      );
      if (props.renderCustomMissingEntityCard) {
        return props.renderCustomMissingEntityCard({
          defaultCard: card,
          entity: {
            id: props.entryId,
            type: 'Entry',
          },
        });
      }
      return card;
    }
    if (status === 'loading') {
      return <EntryCard size={size} isLoading />;
    }

    const sharedCardProps: CustomEntityCardProps = {
      index: props.index,
      entity: entry,
      entityUrl: props.getEntityUrl && props.getEntityUrl(entry.sys.id),
      contentType: props.allContentTypes.find(
        (contentType) => contentType.sys.id === entry.sys.contentType.sys.id,
      ),
      isDisabled: props.isDisabled,
      size,
      localeCode: props.sdk.locales.default,
      defaultLocaleCode: props.sdk.locales.default,
      renderDragHandle: props.renderDragHandle,
      onEdit,
      onRemove: onRemoveEntry,
      onMoveTop: props.onMoveTop,
      onMoveBottom: props.onMoveBottom,
      isBeingDragged: props.isBeingDragged,
      useLocalizedEntityStatus: undefined,
      isLocalized: false,
    };

    const { hasCardEditActions, hasCardMoveActions, hasCardRemoveActions } = props;

    function renderDefaultCard(props?: CustomEntityCardProps) {
      const builtinCardProps: WrappedEntryCardProps = {
        ...sharedCardProps,
        ...props,
        hasCardEditActions,
        hasCardMoveActions,
        hasCardRemoveActions,
        getAsset,
        getEntityScheduledActions: loadEntityScheduledActions,
        entry: (props?.entity as any) || (sharedCardProps.entity as any),
        entryUrl: props?.entityUrl || sharedCardProps.entityUrl,
      };

      return <WrappedEntryCard {...builtinCardProps} isClickable={!sharedCardProps?.isDisabled} />;
    }

    if (props.renderCustomCard) {
      // LinkActionsProps are injected higher SingleReferenceEditor/MultipleReferenceEditor
      const renderedCustomCard = props.renderCustomCard(
        sharedCardProps,
        {} as LinkActionsProps,
        renderDefaultCard,
      );
      // Only `false` indicates to render the original card. E.g. `null` would result in no card.
      if (renderedCustomCard !== false) {
        return renderedCustomCard;
      }
    }

    return renderDefaultCard();
    // eslint-disable-next-line  -- TODO: Evaluate the dependencies
  }, [props, status, entry]);
}
