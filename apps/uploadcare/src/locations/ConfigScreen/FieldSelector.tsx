import { Checkbox, Form, Paragraph, Subheading } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { ContentTypeProps } from 'contentful-management';
import { css } from '@emotion/css';
import { ReactElement, useCallback, useMemo } from 'react';
import { getCompatibleFields, SelectedFields } from './fields';
import { NoContentTypes } from './NoContentTypes';

const styles = {
  contentType: css({
    marginTop: tokens.spacingL,
  }),
};

type Props = {
  space: string;
  environment: string;
  contentTypes: ContentTypeProps[];
  selectedFields: SelectedFields;
  onSelectedFieldChanged: (selectedFields: SelectedFields) => void;
};

export function FieldSelector({
  environment,
  space,
  contentTypes: allContentTypes,
  selectedFields,
  onSelectedFieldChanged,
}: Props): ReactElement {
  const compatibleFields = useMemo(() => getCompatibleFields(allContentTypes), [allContentTypes]);
  const contentTypes = useMemo(
    () =>
      allContentTypes.filter(ct => {
        const fields = compatibleFields[ct.sys.id];
        return fields?.length > 0;
      }),
    [compatibleFields, allContentTypes],
  );

  const changeSelectedFields = useCallback(
    (contentTypeId: string, fieldId: string, checked: boolean) => {
      const updated = { ...selectedFields };

      if (!updated[contentTypeId]) {
        updated[contentTypeId] = [];
      }

      if (checked) {
        updated[contentTypeId] = [...updated[contentTypeId], fieldId];
      } else {
        updated[contentTypeId] = updated[contentTypeId].filter(cur => cur !== fieldId);
      }

      onSelectedFieldChanged(updated);
    },
    [selectedFields, onSelectedFieldChanged],
  );

  if (contentTypes.length === 0) {
    return <NoContentTypes space={space} environment={environment} />;
  }

  return (
    <>
      <Paragraph>
        This app can only be used with <strong>JSON Object</strong> fields. Select which JSON fields you’d like to
        enable for this app.
      </Paragraph>

      {contentTypes.map(contentType => (
        <div key={contentType.sys.id} className={styles.contentType}>
          <Subheading>{contentType.name}</Subheading>
          <Form>
            {compatibleFields[contentType.sys.id].map(field => (
              <Checkbox
                key={field.id}
                helpText={`Field ID: ${field.id}`}
                isChecked={(selectedFields[contentType.sys.id] ?? []).includes(field.id)}
                onChange={e => changeSelectedFields(contentType.sys.id, field.id, e.currentTarget.checked)}
              >
                {field.name}
              </Checkbox>
            ))}
          </Form>
        </div>
      ))}
    </>
  );
}
