import React, { memo, useCallback } from 'react';
import { Box, Heading, Stack } from '@contentful/f36-components';
import { VariationContentMapping } from './VariationContentMapping';
import { EnhancedContentfulEntry } from '../types';

interface VariationContentSectionProps {
  variations: Array<{ name: string; value: any }>;
  enhancedVariationContent: Record<number, EnhancedContentfulEntry>;
  onSelectContent: (index: number, entry: EnhancedContentfulEntry) => void;
  onEditEntry: (entryId: string) => void;
  onRemoveContent: (index: number) => void;
}

// Individual variation wrapper component to isolate handlers
const VariationWrapper = memo(({ 
  variation, 
  variationIndex, 
  entryLink, 
  onSelectContent, 
  onEditEntry, 
  onRemoveContent 
}: {
  variation: { name: string; value: any };
  variationIndex: number;
  entryLink?: EnhancedContentfulEntry;
  onSelectContent: (index: number, entry: EnhancedContentfulEntry) => void;
  onEditEntry: (entryId: string) => void;
  onRemoveContent: (index: number) => void;
}) => {
  const handleRemoveContent = useCallback(() => {
    onRemoveContent(variationIndex);
  }, [onRemoveContent, variationIndex]);

  return (
    <VariationContentMapping
      variation={variation}
      variationIndex={variationIndex}
      entryLink={entryLink}
      onSelectContent={onSelectContent}
      onEditEntry={onEditEntry}
      onRemoveContent={handleRemoveContent}
    />
  );
});

export const VariationContentSection: React.FC<VariationContentSectionProps> = ({
  variations,
  enhancedVariationContent,
  onSelectContent,
  onEditEntry,
  onRemoveContent
}) => {
  // Early return if no variations
  if (!variations?.length) {
    return null;
  }

  return (
    <Box padding="spacingM">
      <Heading marginBottom="spacingL">Variations</Heading>
      <Stack spacing="spacingL" flexDirection="column" alignItems="stretch">
        {variations.map((variation, index) => (
          <VariationWrapper
            key={`variation-${variation.name}-${variation.value}`}
            variation={variation}
            variationIndex={index}
            entryLink={enhancedVariationContent[index]}
            onSelectContent={onSelectContent}
            onEditEntry={onEditEntry}
            onRemoveContent={onRemoveContent}
          />
        ))}
      </Stack>
    </Box>
  );
}; 