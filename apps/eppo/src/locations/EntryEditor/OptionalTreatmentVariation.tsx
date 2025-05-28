import React, { useState } from 'react';

import { Button, Flex, FormControl, ModalConfirm, Text } from '@contentful/f36-components';

import { CloseIcon } from '@contentful/f36-icons';
import { EppoEntrySelector } from '../../components/EppoEntrySelector';
import { entryEditorStyles } from './styles';
import { EntityLink } from '@contentful/field-editor-reference';
import { EditorAppSDK } from '@contentful/app-sdk';

interface OptionalTreatmentVariationProps {
  sdk: EditorAppSDK;
  treatmentIndex: number;
  linkedEntry: EntityLink;
  onLinkEntry: (value: EntityLink, treatmentIndex: number) => Promise<void>;
  onUnlinkEntry: (entryId: string) => Promise<void>;
  onRemoveVariation: (index: number) => void | Promise<void>;
  isDisabled: boolean;
  allowedContentTypes: string[];
}

export const OptionalTreatmentVariation: React.FunctionComponent<
  OptionalTreatmentVariationProps
> = (props) => {
  const [showRemoveVariationConfirmModal, setShowRemoveVariationConfirmModal] = useState(false);
  const labelText = `Treatment Variation ${props.treatmentIndex + 1}`;
  const isLinked = !!props.linkedEntry?.sys?.id;
  return (
    <FormControl
      className={entryEditorStyles.formControl}
      key={`treatment-${props.treatmentIndex}`}
    >
      <Flex justifyContent="space-between" alignItems="center">
        <FormControl.Label>{labelText}</FormControl.Label>
        {props.treatmentIndex > 0 && (
          <>
            <Button
              startIcon={<CloseIcon style={{ fill: '#0059C8' }} />}
              variant="transparent"
              className={entryEditorStyles.removeVariationButton}
              isDisabled={props.isDisabled}
              onClick={() => {
                if (isLinked) {
                  setShowRemoveVariationConfirmModal(true);
                } else {
                  props.onRemoveVariation(props.treatmentIndex);
                }
              }}
            >
              Remove variation
            </Button>
            <ModalConfirm
              intent="primary"
              isShown={showRemoveVariationConfirmModal}
              onCancel={() => {
                setShowRemoveVariationConfirmModal(false);
              }}
              onConfirm={() => {
                props.onRemoveVariation(props.treatmentIndex);
              }}
            >
              <Text>
                Do you want to remove <strong>{labelText}</strong>?
              </Text>
            </ModalConfirm>
          </>
        )}
      </Flex>
      <EppoEntrySelector
        sdk={props.sdk}
        fieldValue={props.linkedEntry}
        onLink={(linkedEntry) => props.onLinkEntry(linkedEntry, props.treatmentIndex)}
        onUnlink={props.onUnlinkEntry}
        isDisabled={props.isDisabled}
        allowedContentTypes={props.allowedContentTypes}
      />
    </FormControl>
  );
};
