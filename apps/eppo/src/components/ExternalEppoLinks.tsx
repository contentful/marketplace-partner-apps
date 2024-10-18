import React from 'react';

import { Stack, TextLink, Note, Text } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

interface ExternalEppoLinksProps {
  variant: 'primary' | 'negative';
  baseUrl: string;
  experimentId: number;
  featureFlagId: number;
  children: React.ReactNode;
}

export const ExternalEppoLinks: React.FunctionComponent<ExternalEppoLinksProps> = (props) => (
  <>
    <Note variant={props.variant}>
      <Stack flexDirection="column" spacing="spacingXs" style={{ alignItems: 'flex-start' }}>
        <Text>{props.children}</Text>
        <TextLink
          icon={<ExternalLinkIcon />}
          alignIcon="start"
          href={`${props.baseUrl}/experiments/${props.experimentId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Go to Eppo experiment analysis
        </TextLink>
        <TextLink
          icon={<ExternalLinkIcon />}
          alignIcon="start"
          href={`${props.baseUrl}/feature-flags/${props.featureFlagId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Go to Eppo feature flag
        </TextLink>
      </Stack>
    </Note>
  </>
);
