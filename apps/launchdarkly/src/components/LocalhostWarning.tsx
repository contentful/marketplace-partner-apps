import { Heading, Note, Paragraph } from '@contentful/f36-components';
import React from 'react';

export default function LocalhostWarning() {
  return (
    <Note variant="warning" style={{ maxWidth: '800px', margin: '100px auto' }}>
      <Heading>LaunchDarkly Contentful App</Heading>
      <Paragraph>
        This app can only be used within the Contentful web app. Please install the app in a Contentful space to use it.
      </Paragraph>
      <Paragraph>
        <strong>Development Mode:</strong> Run <code>npm start</code> and configure the app URL in your Contentful space settings to <code>http://localhost:3000</code>
      </Paragraph>
    </Note>
  );
}
