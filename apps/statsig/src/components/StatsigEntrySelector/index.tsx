import React, { useCallback } from 'react';

import { EditorAppSDK } from '@contentful/app-sdk';
import { EntityLink } from '@contentful/field-editor-reference';
import { LinkActions } from '../field-editor-reference/components/LinkActions/LinkActions';
import { StatsigEntryCard } from './StatsigEntryCard';
import { VARIANT_CONTAINER_ID } from '../../constants';
import { useEntryEditorPermissions } from '../../hooks/useEntryEditorPermissions';
import { useLinkActionsProps } from '../modified/useLinkActionsProps';

interface Props {
  sdk: EditorAppSDK;
  fieldValue: EntityLink | undefined;
  onLink: (value: EntityLink) => void;
  onUnlink: (entryId: string) => void;
  isDisabled: boolean;
}

const getEntryId = (value: EntityLink | undefined): string | undefined => {
  return value?.sys?.id;
};

const EXCLUDED_CONTENT_TYPES = [VARIANT_CONTAINER_ID];

export const StatsigEntrySelector: React.FunctionComponent<Props> = (props) => {
  const sdk = props.sdk;
  const editorPermissions = useEntryEditorPermissions(sdk);
  const { fieldValue, isDisabled } = props;
  const entryId = getEntryId(fieldValue);

  const linkEntry = useCallback(
    (id: string) => {
      props.onLink({
        sys: {
          type: 'Link',
          id,
          linkType: 'Entry',
        },
      } as EntityLink);
    },
    [props],
  );

  const handleCreate = useCallback(
    (id: string) => {
      if (id) {
        linkEntry(id);
      }
    },
    [linkEntry],
  );

  const handleLink = useCallback(
    (ids: string[]) => {
      const id = ids[0];
      if (id) {
        linkEntry(id);
      }
    },
    [linkEntry],
  );

  const linkActionsProps = useLinkActionsProps({
    entityType: 'Entry',
    canLinkMultiple: false,
    sdk,
    fieldValue,
    isDisabled,
    editorPermissions,
    excludedContentTypes: EXCLUDED_CONTENT_TYPES,
    onCreate: handleCreate,
    onLink: handleLink,
  });

  return (
    <>
      {entryId ? (
        <StatsigEntryCard
          entryId={entryId}
          sdk={sdk}
          onRemove={() => {
            props.onUnlink(entryId);
          }}
          isDisabled={props.isDisabled}
        />
      ) : (
        <LinkActions {...linkActionsProps} />
      )}
    </>
  );
};
