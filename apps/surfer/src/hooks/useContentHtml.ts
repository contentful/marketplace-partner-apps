import { EntryFieldAPI } from '@contentful/app-sdk';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { useEffect, useMemo, useState } from 'react';

const getAllHtml = (fieldValues: any[]) => fieldValues.map((field) => documentToHtmlString(field)).join('');

export const useContentHtml = (allFields: EntryFieldAPI[], selectedFields: EntryFieldAPI[]) => {
  const [contentHtml, setContentHtml] = useState<string>('');
  const [fieldValues, setFieldValues] = useState<{ [fieldId: string]: string }>({});

  const selectedFieldsIds = useMemo(() => selectedFields.map(({ id }) => id), [selectedFields]);

  useEffect(() => {
    for (const field of allFields) {
      field.onValueChanged((value) => {
        setFieldValues((values) => ({ ...values, [field.id]: value }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const selectedFieldsValues = Object.entries(fieldValues)
      .filter(([fieldId]) => selectedFieldsIds.includes(fieldId))
      .map(([_fieldId, value]) => value);

    setContentHtml(getAllHtml(selectedFieldsValues));
  }, [fieldValues, selectedFieldsIds]);

  return contentHtml;
};
