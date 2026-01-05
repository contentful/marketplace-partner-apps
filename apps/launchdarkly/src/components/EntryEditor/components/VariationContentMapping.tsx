import React, { useState, useEffect, memo, useCallback } from 'react';
import { Card, Subheading, Stack, Text, Button, Box } from '@contentful/f36-components';
import { VariationContentSelector } from './VariationContentSelector';
import { EntryPreview } from './EntryPreview';
import { VariationContentMappingProps } from '../types';

const VariationContentMappingComponent: React.FC<VariationContentMappingProps> = ({
  variation,
  variationIndex,
  entryLink,
  onSelectContent,
  onEditEntry,
  onRemoveContent
}) => {
  const [showSelector, setShowSelector] = useState(!entryLink);
  
  // Reset showSelector when entryLink changes
  useEffect(() => {
    if (!entryLink) {
      setShowSelector(true);
    }
  }, [entryLink, variationIndex]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleSelectContent = useCallback((idx: number, entry: any) => {
    setShowSelector(false);
    onSelectContent(idx, entry);
  }, [onSelectContent]);

  const handleRemove = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    console.log('[VariationContentMapping] Removing content for variation:', variationIndex);
    setShowSelector(true);
    onRemoveContent();
  }, [variationIndex, onRemoveContent]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleShowSelector = useCallback(() => {
    setShowSelector(true);
  }, []);

  // If no entry link, always show selector
  if (!entryLink || showSelector) {
    return (
      <Card padding="default">
        <Stack spacing="spacingM"
               alignItems="center"
               justifyContent="space-between"
               flexDirection="row"
               style={{ width: '100%' }}>
          <Box>
            <Subheading marginBottom="none">{variation.name}</Subheading>
            <Text fontColor="gray500" fontSize="fontSizeS" marginTop="spacing2Xs">
              LaunchDarkly Value: <span style={{ fontWeight: 'bold' }}>{typeof variation.value === 'string' ? variation.value : JSON.stringify(variation.value)}</span>
            </Text>
          </Box>
          <VariationContentSelector
            variationName={variation.name}
            variationIndex={variationIndex}
            onSelectContent={handleSelectContent}
          />
        </Stack>
      </Card>
    );
  }

  // Otherwise show the preview
  return (
    <Card padding="default" marginBottom="spacingL">
      <Stack spacing="spacingS" flexDirection="column" alignItems="stretch">
        <Box paddingLeft="spacingM" style={{ marginTop: '8px' }}>
          <Subheading marginBottom="none">{variation.name}</Subheading>
          <Text fontColor="gray500" fontSize="fontSizeS" marginTop="spacing2Xs">
            LaunchDarkly Value: <span style={{ fontWeight: 'bold' }}>{typeof variation.value === 'string' ? variation.value : JSON.stringify(variation.value)}</span>
          </Text>
        </Box>
        <Stack spacing="spacingM" flexDirection="row" alignItems="flex-start" justifyContent="space-between">
          <EntryPreview
            entryId={entryLink.sys.id}
            onEdit={onEditEntry}
            onRemove={handleRemove}
          />
          <Box paddingTop="spacingM">
            <Button 
              onClick={handleRemove} 
              variant="negative"
              id={`remove-content-${variationIndex}`}
            >
              Remove Content
            </Button>
          </Box>
        </Stack>
      </Stack>
    </Card>
  );
};

// Export memoized component to prevent unnecessary re-renders
export const VariationContentMapping = memo(VariationContentMappingComponent); 