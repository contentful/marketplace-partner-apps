import { EditorAppSDK } from '@contentful/app-sdk';
import { EntityLink } from '@contentful/field-editor-reference';
import React, { useCallback } from 'react';
import { VARIATION_CONTAINER_ID } from '../../constants';
import { useEntryEditorPermissions } from '../../hooks/useEntryEditorPermissions';
import { LinkActions } from '../field-editor-reference/components/LinkActions/LinkActions';
import { useLinkActionsProps } from '../modified/useLinkActionsProps';
import { EppoEntryCard } from './EppoEntryCard';

interface ILinkedEntryCardProps {
  sdk: EditorAppSDK;
  fieldValue: EntityLink | undefined;
  onLink: (value: EntityLink) => void;
  onUnlink: (entryId: string) => void;
  isDisabled: boolean;
  allowedContentTypes: string[];
}

const getEntryId = (value: EntityLink | undefined): string | undefined => {
  return value?.sys?.id;
};

const EXCLUDED_CONTENT_TYPES = [VARIATION_CONTAINER_ID];

export const EppoEntrySelector: React.FunctionComponent<ILinkedEntryCardProps> = (props) => {
  const sdk = props.sdk;
  const editorPermissions = useEntryEditorPermissions(sdk, props.allowedContentTypes);
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
        <EppoEntryCard
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
