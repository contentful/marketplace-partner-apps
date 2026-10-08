import { Flex, Button } from '@contentful/f36-components';
import { ChevronDownIcon, ChevronUpIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { CSSProperties, forwardRef } from 'react';
import { Loader } from './Loader';

const HIDDEN_STYLES: CSSProperties = {
  visibility: 'hidden',
  height: 0,
};

export const SurferContainer = forwardRef<
  HTMLDivElement,
  {
    isLoading: boolean;
    isExpanded?: boolean;
    toggleExpanded?: (nextState: boolean) => void;
    flex?: string;
    height?: string;
  }
>(({ isLoading, flex, height, isExpanded, toggleExpanded }, ref) => (
  <Flex flexDirection="column" justifyContent="space-between" fullHeight gap={tokens.spacingS} style={{ overflow: 'hidden' }}>
    {toggleExpanded && !isLoading && (
      <Button
        isFullWidth
        size="medium"
        variant="secondary"
        endIcon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        onClick={() => toggleExpanded(!isExpanded)}>
        {isExpanded ? 'Collapse' : 'Expand'}
      </Button>
    )}
    <Loader isLoading={isLoading} />
    <div ref={ref} id="surfer-iframe" style={isLoading ? HIDDEN_STYLES : { flex, height }} />
  </Flex>
));
