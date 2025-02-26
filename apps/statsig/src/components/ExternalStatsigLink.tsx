import { Note, Stack, Text, TextLink } from '@contentful/f36-components';

import { ExternalLinkIcon } from '@contentful/f36-icons';
import React from 'react';

interface ExternalStatsigLinkProps {
  variant: 'primary' | 'neutral' | 'positive';
  url: string;
  linkLabel: string;
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
          href={props.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {props.linkLabel}
        </TextLink>
      </Stack>
    </Note>
  </>
);
