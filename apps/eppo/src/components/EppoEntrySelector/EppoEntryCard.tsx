import React from 'react';

import { EditorAppSDK } from '@contentful/app-sdk';
import { EntityProvider } from '@contentful/field-editor-reference';

import { ReferenceEditorProps } from '../field-editor-reference/common/ReferenceEditor';
import {
  EntryCardReferenceEditorProps,
  FetchingWrappedEntryCard,
} from '../modified/FetchingWrappedEntryCard';

interface IEppoEntryCardProps {
  entryId: string;
  sdk: EditorAppSDK;
  onRemove: () => void;
  isDisabled: boolean;
}

const disabledCardActions = {
  hasCardEditActions: false,
  hasCardMoveActions: false,
  hasCardRemoveActions: false,
};

const EppoEntryCardWrapped: React.FunctionComponent<IEppoEntryCardProps> = ({
  entryId,
  sdk,
  onRemove,
  isDisabled,
}) => {
  const contentTypes = sdk.space.getCachedContentTypes();

  const getCardActions = () => {
    if (isDisabled) {
      return disabledCardActions;
    }
    return {
      hasCardEditActions: false,
      hasCardMoveActions: false,
      hasCardRemoveActions: true,
    };
  };

  const referenceEditorProps: Omit<ReferenceEditorProps, 'sdk'> = {
    ...getCardActions(),
    isInitiallyDisabled: isDisabled,
    viewType: 'card',
    parameters: {
      instance: {
        showCreateEntityAction: true,
        showLinkEntityAction: true,
        bulkEditing: false,
      },
    },
  };

  const props: EntryCardReferenceEditorProps = {
    ...referenceEditorProps,
    sdk,
    entryId,
    allContentTypes: contentTypes,
    isDisabled,
    onRemove,
  };

  return <FetchingWrappedEntryCard {...props} />;
};

export const EppoEntryCard: React.FunctionComponent<IEppoEntryCardProps> = (props) => {
  return props.entryId ? (
    <EntityProvider sdk={props.sdk}>
      <EppoEntryCardWrapped {...props} />
    </EntityProvider>
  ) : (
    <></>
  );
};
