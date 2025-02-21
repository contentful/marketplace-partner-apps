import { Note, Stack, Text, TextLink } from '@contentful/f36-components';

import { ExternalLinkIcon } from '@contentful/f36-icons';
import React from 'react';

interface ExternalStatsigLinkProps {
  variant: 'primary' | 'negative';
  projectId: string;
  experimentId: string;
  children: React.ReactNode;
}

export const ExternalStatsigLink: React.FunctionComponent<ExternalStatsigLinkProps> = (props) => (
  <>
    <Note variant={props.variant}>
      <Stack flexDirection="column" spacing="spacingXs" style={{ alignItems: 'flex-start' }}>
        <Text>{props.children}</Text>
        <TextLink
          icon={<ExternalLinkIcon />}
          alignIcon="start"
          href={`https://console.statsig.com/${props.projectId}/experiments/${props.experimentId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Go to Statsig experiment
        </TextLink>
      </Stack>
    </Note>
  </>
);
