/*
Contentful - translationstudio extension
Copyright (C) 2025 I-D Media GmbH, idmedia.com

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, see https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
*/
import React from 'react';
import { Paragraph, TextLink, Note, Flex } from '@contentful/f36-components';

const LocalhostWarning = () => {
  return (
    <Flex marginTop="spacingXl" justifyContent="center">
      <Note title="App running outside of Contentful" style={{ maxWidth: '800px' }}>
        <Paragraph>
          Contentful Apps need to run inside the Contentful web app to function properly. Install
          the app into a space and render your app into one of the{' '}
          <TextLink href="https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#locations">
            available locations
          </TextLink>
          .
        </Paragraph>
        <br />

        <Paragraph>
          Follow{' '}
          <TextLink href="https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/#embed-your-app-in-the-contentful-web-app">
            our guide
          </TextLink>{' '}
          to get started or{' '}
          <TextLink href="https://app.contentful.com/deeplink?link=apps">open Contentful</TextLink>{' '}
          to manage your app.
        </Paragraph>
      </Note>
    </Flex>
  );
};

export default LocalhostWarning;
