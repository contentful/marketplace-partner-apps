import * as React from 'react';

import { Action, ActionLabels, FieldAppSDK, ViewType } from '../types';
import { CustomCardRenderer, RenderCustomMissingEntityCard } from './customCardTypes';

import { EntityProvider } from './EntityStore';
import { FieldConnector } from '@contentful/field-editor-shared';
import type { LinkActionsProps } from '../components';

export interface ReferenceEditorProps {
  /**
   * Whether or not the field should be disabled initially.
   */
  isInitiallyDisabled: boolean;
  hasCardEditActions: boolean;
  hasCardMoveActions?: boolean;
  hasCardRemoveActions?: boolean;
  sdk: FieldAppSDK;
  viewType: ViewType;
  renderCustomCard?: CustomCardRenderer;
  renderCustomActions?: (props: CustomActionProps) => React.ReactElement;
  renderCustomMissingEntityCard?: RenderCustomMissingEntityCard;
  getEntityUrl?: (entryId: string) => string;
  onAction?: (action: Action) => void;
  actionLabels?: Partial<ActionLabels>;
  parameters: {
    instance: {
      showCreateEntityAction?: boolean;
      showLinkEntityAction?: boolean;
      bulkEditing?: boolean;
    };
  };
  updateBeforeSortStart?: ({ index }: { index: number }) => void;
  onSortingEnd?: ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => void;
}

export type CustomActionProps = LinkActionsProps;

export function ReferenceEditor<T>(
  props: ReferenceEditorProps & {
    children: FieldConnector<T>['props']['children'];
  },
) {
  return (
    <EntityProvider sdk={props.sdk}>
      <FieldConnector<T>
        debounce={0}
        field={props.sdk.field}
        isInitiallyDisabled={props.isInitiallyDisabled}
      >
        {props.children}
      </FieldConnector>
    </EntityProvider>
  );
}

ReferenceEditor.defaultProps = {
  isInitiallyDisabled: true,
  hasCardEditActions: true,
};
