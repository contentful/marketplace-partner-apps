import { Checkbox, Form, Note, Paragraph, Subheading, TextLink } from '@contentful/f36-components';
import { SelectedFields, getCompatibleFields } from './fields';
import { useCallback, useMemo } from 'react';
import { ContentTypeProps } from 'contentful-management';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

interface Props {
  space: string;
  environment: string;
  contentTypes: ContentTypeProps[];
  selectedFields: SelectedFields;
  onSelectedFieldChanged: (selectedFields: SelectedFields) => void;
}

export function FieldSelector({ environment, space, contentTypes: allContentTypes, selectedFields, onSelectedFieldChanged }: Props) {
  const compatibleFields = useMemo(() => getCompatibleFields(allContentTypes), [allContentTypes]);
  const contentTypes = useMemo(
    () =>
      allContentTypes.filter((ct) => {
        const fields = compatibleFields[ct.sys.id];
        return fields && fields.length > 0;
      }),
    [compatibleFields, allContentTypes]
  );

  const changeSelectedFields = useCallback(
    (contentTypeId: string, fieldId: string, checked: boolean) => {
      const updated = { ...selectedFields };

      if (checked) {
        updated[contentTypeId] = [...(updated[contentTypeId] ?? []), fieldId];
      } else {
        updated[contentTypeId] = (updated[contentTypeId] ?? []).filter((cur) => cur !== fieldId);
      }

      onSelectedFieldChanged(updated);
    },
    [selectedFields, onSelectedFieldChanged]
  );

  if (contentTypes.length === 0) {
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
            href={
              environment === 'master'
                ? `https://app.contentful.com/spaces/${space}/content_types`
                : `https://app.contentful.com/spaces/${space}/environments/${environment}/content_types`
            }>
            content model
          </TextLink>{' '}
          and assign it to the app from this screen.
        </Note>
      </>
    );
  }

  return (
    <>
      <Paragraph>
        This app can only be used with <strong>JSON object</strong> fields. Select which JSON fields you’d like to enable for this app.
      </Paragraph>
      {contentTypes.map((contentType) => (
        <div key={contentType.sys.id} className={css({ marginTop: tokens.spacingL })}>
          <Subheading>{contentType.name}</Subheading>
          <Form>
            {compatibleFields[contentType.sys.id].map((field) => (
              <Checkbox
                key={field.id}
                id={`field-box-${contentType.sys.id}-${field.id}`}
                helpText={`Field ID: ${field.id}`}
                isChecked={(selectedFields[contentType.sys.id] ?? []).includes(field.id)}
                onChange={(e) => changeSelectedFields(contentType.sys.id, field.id, e.currentTarget.checked)}>
                {field.name}
              </Checkbox>
            ))}
          </Form>
        </div>
      ))}
    </>
  );
}
