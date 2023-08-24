import { Note, Paragraph, TextLink } from '@contentful/f36-components';
import { ReactElement } from 'react';

type Props = {
  space: string;
  environment: string;
};

export function NoContentTypes({ space, environment }: Props): ReactElement {
  return (
    <>
      <Paragraph>
        This app can be used only with <strong>JSON object</strong> fields.
      </Paragraph>

      <Note variant="warning">
        There are <strong>no content types with JSON object</strong> fields in this environment. You can add one in your{' '}
        <TextLink
          variant="primary"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://app.contentful.com/spaces/${space}/environments/${environment}/content_types`}
        >
          content model
        </TextLink>{' '}
        and assign it to the app from this screen.
      </Note>
    </>
  );
}
