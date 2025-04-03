import * as React from 'react';
import { useMemo } from 'react';

import {
  Asset,
  ContentEntityType,
  ContentType,
  EditorAppSDK,
  Entry,
  NavigatorAPI,
  NavigatorSlideInfo,
} from '@contentful/app-sdk';
import { Action } from '@contentful/field-editor-reference';
import { EditorPermissions } from '../components/field-editor-reference/common/useEditorPermissions';
import { LinkActionsProps } from '../components/field-editor-reference/components/LinkActions/LinkActions';

type ActionLabels = {
  createNew: (props?: { contentType?: string }) => string;
  linkExisting: (props?: { canLinkMultiple?: boolean }) => string;
};

type LinkEntityActionsProps = {
  entityType: ContentEntityType;
  canLinkMultiple: boolean;
  sdk: EditorAppSDK;
  fieldValue: any;
  isDisabled: boolean;
  editorPermissions: EditorPermissions;
  onCreate: (id: string, index?: number) => void;
  onLink: (ids: string[], index?: number) => void;
  onAction?: (action: Action) => void;
  actionLabels?: Partial<ActionLabels>;
  itemsLength?: number;
  excludedContentTypes: string[];
};

const getContentTypeIds = (contentTypes: ContentType[]) => contentTypes.map((ct) => ct.sys.id);

async function createEntity(props: {
  navigator: NavigatorAPI;
  entityType: ContentEntityType;
  contentTypeId?: string;
}) {
  if (props.entityType === 'Entry') {
    if (!props.contentTypeId) {
      return {};
    }
    const { entity, slide } = await props.navigator.openNewEntry<Entry>(props.contentTypeId, {
      slideIn: true,
    });
    return { entity, slide };
  } else {
    const { entity, slide } = await props.navigator.openNewAsset({
      slideIn: true,
    });
    return { entity, slide };
  }
}

async function selectSingleEntity(props: {
  sdk: EditorAppSDK;
  entityType: ContentEntityType;
  editorPermissions: EditorPermissions;
  excludedContentTypes: string[];
}) {
  const availableContentTypes = props.editorPermissions.availableContentTypes.filter(
    (contentType) => {
      return !props.excludedContentTypes.includes(contentType.sys.id);
    },
  );
  if (props.entityType === 'Entry') {
    return await props.sdk.dialogs.selectSingleEntry<Entry>({
      locale: props.sdk.locales.default,
      // readable CTs do not cover cases where user has partial access to a CT entry,
      // e.g. via tags so we're passing in all available CTs (based on field validations)
      contentTypes: getContentTypeIds(availableContentTypes),
    });
  } else {
    return props.sdk.dialogs.selectSingleAsset<Asset>({
      locale: props.sdk.locales.default,
      mimetypeGroups: props.editorPermissions.validations.mimetypeGroups,
    });
  }
}

async function selectMultipleEntities(props: {
  sdk: EditorAppSDK;
  fieldValue: any;
  entityType: ContentEntityType;
  editorPermissions: EditorPermissions;
  excludedContentTypes: string[];
}) {
  const availableContentTypes = props.editorPermissions.availableContentTypes.filter(
    (contentType) => {
      return !props.excludedContentTypes.includes(contentType.sys.id);
    },
  );
  const value = props.fieldValue;

  const linkCount = Array.isArray(value) ? value.length : value ? 1 : 0;

  // TODO: Why not always set `min: 1` by default? Does it make sense to enforce
  //  user to select as many entities as the field's "min" requires? What if e.g.
  // "min" is 4 and the user wants to insert 2 entities first, then create 2 new ones?
  const min = Math.max(
    (props.editorPermissions.validations.numberOfLinks?.min || 1) - linkCount,
    1,
  );
  // TODO: Consider same for max. If e.g. "max" is 4, we disable the button if the
  //  user wants to select 5 but we show no information why the button is disabled.
  const max = (props.editorPermissions.validations.numberOfLinks?.max || +Infinity) - linkCount;

  if (props.entityType === 'Entry') {
    return await props.sdk.dialogs.selectMultipleEntries<Entry>({
      locale: props.sdk.locales.default,
      // readable CTs do not cover cases where user has partial access to a CT entry,
      // e.g. via tags so we're passing in all available CTs (based on field validations)
      contentTypes: getContentTypeIds(availableContentTypes),
      min,
      max,
    });
  } else {
    return props.sdk.dialogs.selectMultipleAssets<Asset>({
      locale: props.sdk.locales.default,
      mimetypeGroups: props.editorPermissions.validations.mimetypeGroups,
      min,
      max,
    });
  }
}

export function useLinkActionsProps(props: LinkEntityActionsProps): LinkActionsProps {
  const {
    sdk,
    fieldValue,
    editorPermissions,
    entityType,
    canLinkMultiple,
    isDisabled,
    actionLabels,
    itemsLength,
  } = props;

  const maxLinksCount = editorPermissions.validations.numberOfLinks?.max;
  const value = fieldValue;
  const linkCount = Array.isArray(value) ? value.length : value ? 1 : 0;
  const isFull = !!maxLinksCount && maxLinksCount <= linkCount;
  const isEmpty = linkCount === 0;

  const onCreated = React.useCallback(
    (entity: Entry | Asset, index = itemsLength, slide?: NavigatorSlideInfo) => {
      props.onCreate(entity.sys.id, index);
      props.onAction &&
        props.onAction({
          type: 'create_and_link',
          entity: entityType,
          entityData: entity,
          slide,
          index,
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: Evaluate the dependencies
    [entityType, props.onCreate, props.onAction],
  );
  const onLinkedExisting = React.useCallback(
    (entities: Array<Entry | Asset>, index = itemsLength) => {
      props.onLink(
        entities.map((item) => item.sys.id),
        index,
      );
      entities.forEach((entity, i) => {
        props.onAction &&
          props.onAction({
            type: 'select_and_link',
            entity: entityType,
            entityData: entity,
            index: index === undefined ? undefined : index + i,
          });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: Evaluate the dependencies
    [entityType, props.onLink, props.onAction],
  );

  const onCreate = React.useCallback(
    async (contentTypeId?: string, index?: number) => {
      const { entity, slide } = await createEntity({
        navigator: sdk.navigator,
        entityType,
        contentTypeId,
      });
      if (!entity) {
        return;
      }

      onCreated(entity, index, slide);
    },
    [sdk, entityType, onCreated],
  );

  const onLinkExisting = React.useCallback(
    async (index?: number) => {
      const entity = await selectSingleEntity({
        sdk,
        entityType,
        editorPermissions,
        excludedContentTypes: props.excludedContentTypes ?? [],
      });
      if (!entity) {
        return;
      }

      onLinkedExisting([entity], index);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: Evaluate the dependencies
    [sdk, entityType, onLinkedExisting],
  );

  const onLinkSeveralExisting = React.useCallback(
    async (index?: number) => {
      const entities = await selectMultipleEntities({
        sdk,
        fieldValue,
        entityType,
        editorPermissions,
        excludedContentTypes: props.excludedContentTypes ?? [],
      });

      if (!entities || entities.length === 0) {
        return;
      }
      onLinkedExisting(entities, index);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: Evaluate the dependencies
    [sdk, entityType, onLinkedExisting],
  );

  // FIXME: The memoization might rerun every time due to the always changing callback identities above
  return useMemo(
    () => ({
      entityType,
      canLinkMultiple,
      isDisabled,
      isEmpty,
      isFull,
      canCreateEntity: editorPermissions.canCreateEntity,
      canLinkEntity: editorPermissions.canLinkEntity,
      contentTypes: editorPermissions.creatableContentTypes,
      onCreate,
      onLinkExisting: canLinkMultiple ? onLinkSeveralExisting : onLinkExisting,
      actionLabels,
      onCreated,
      onLinkedExisting,
      itemsLength,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: Evaluate the dependencies
    [
      entityType,
      canLinkMultiple,
      isDisabled,
      isEmpty,
      isFull,
      editorPermissions.canCreateEntity,
      editorPermissions.canLinkEntity,
      actionLabels,
      // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: Evaluate the dependencies
      editorPermissions.creatableContentTypes.map((ct) => ct.sys.id).join(':'),
      onCreate,
      onLinkExisting,
      onLinkSeveralExisting,
      onCreated,
      onLinkedExisting,
      itemsLength,
    ],
  );
}
