import React from 'react';
import { Flex, FormLabel, Switch, Button, Tooltip } from '@contentful/f36-components';

interface ResultsControlsProps {
  resultCount: number;
  publishAfterUpdate: boolean;
  selectedCount: number;
  applyingChanges: boolean;
  formModifiedSinceSearch: boolean;
  onPublishToggleChange: (publish: boolean) => void;
  onApplyChanges: () => void;
}

export const ResultsControls: React.FC<ResultsControlsProps> = ({
  resultCount,
  publishAfterUpdate,
  selectedCount,
  applyingChanges,
  formModifiedSinceSearch,
  onPublishToggleChange,
  onApplyChanges,
}) => {
  const applyButton = (
    <Button
      variant="positive"
      isDisabled={selectedCount === 0 || applyingChanges || formModifiedSinceSearch}
      onClick={onApplyChanges}
      isLoading={applyingChanges}>
      Apply changes to {selectedCount} {selectedCount === 1 ? 'entry' : 'entries'}
    </Button>
  );

  return (
    <Flex justifyContent="space-between" alignItems="center" marginTop="spacingL">
      <Flex alignItems="center" gap="spacingM">
        <FormLabel htmlFor="results">Results: {resultCount}</FormLabel>
      </Flex>
      <Flex alignItems="center" gap="spacingM">
        <Switch id="publishToggle" isChecked={publishAfterUpdate} onChange={() => onPublishToggleChange(!publishAfterUpdate)}>
          Publish after update
        </Switch>
        {formModifiedSinceSearch ? (
          <Tooltip content="Search form has been modified. Please search again before applying changes.">{applyButton}</Tooltip>
        ) : (
          applyButton
        )}
      </Flex>
    </Flex>
  );
};
