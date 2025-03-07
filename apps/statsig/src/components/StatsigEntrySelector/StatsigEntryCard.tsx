import {
  EntryCardReferenceEditorProps,
  FetchingWrappedEntryCard,
} from '../modified/FetchingWrappedEntryCard';

import { EditorAppSDK } from '@contentful/app-sdk';
import { EntityProvider } from '@contentful/field-editor-reference';
import React from 'react';
import { ReferenceEditorProps } from '../field-editor-reference/common/ReferenceEditor';

interface IStatsigEntryCardProps {
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

const StatsigEntryCardWrapped: React.FunctionComponent<IStatsigEntryCardProps> = ({
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

export const StatsigEntryCard: React.FunctionComponent<IStatsigEntryCardProps> = (props) => {
  return props.entryId ? (
    <EntityProvider sdk={props.sdk}>
      <StatsigEntryCardWrapped {...props} />
    </EntityProvider>
  ) : (
    <></>
  );
};
