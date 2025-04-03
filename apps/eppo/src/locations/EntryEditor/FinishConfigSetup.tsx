import { EditorAppSDK } from '@contentful/app-sdk';
import { Box, Card, DisplayText, List, Paragraph, TextLink } from '@contentful/f36-components';
import { css } from 'emotion';
import React from 'react';

const container = css({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  paddingBottom: '60px',
});

interface FinishConfigSetupProps {
  sdk: EditorAppSDK;
  missingConfigFields: Array<string>;
}

export const FinishConfigSetup: React.FunctionComponent<FinishConfigSetupProps> = (props) => {
  const appId = props.sdk.ids.app;
  const spaceId = props.sdk.ids.space;
  const configUrl = `https://app.contentful.com/spaces/${spaceId}/apps/${appId}`;

  return (
    <Box className={container}>
      <DisplayText>Please finish configuring the Eppo app</DisplayText>
      <Card style={{ maxWidth: 300 }}>
        <Paragraph>The following fields are missing:</Paragraph>
        <List>
          {props.missingConfigFields.map((field) => (
            <List.Item key={field}>{field}</List.Item>
          ))}
        </List>
      </Card>
      <Box style={{ marginTop: '30px' }}>
        <TextLink href={configUrl} target="_blank" rel="noopener noreferrer">
          Go to app configuration
        </TextLink>
      </Box>
    </Box>
  );
};
