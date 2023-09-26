import { EntryFieldAPI } from '@contentful/app-sdk';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { useEffect, useState } from 'react';
import { ContentFieldId } from '../types';

const getAllHtml = (fieldValues: any[]) => fieldValues.map((field) => documentToHtmlString(field)).join('');

export const useContentHtml = (allRichTextFields: EntryFieldAPI[], selectedFields: ContentFieldId[]) => {
  const [contentHtml, setContentHtml] = useState<string>('');
  const [fieldValues, setFieldValues] = useState<{ [fieldId: string]: string }>({});

  useEffect(() => {
    const allSelectedFields = allRichTextFields.filter(({ id }) => selectedFields.includes(id));

    for (const field of allSelectedFields) {
      field.onValueChanged((value) => {
        setFieldValues((values) => ({ ...values, [field.id]: value }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const selectedFieldsValues = Object.values(fieldValues);

    setContentHtml(getAllHtml(selectedFieldsValues));
  }, [fieldValues]);

  return contentHtml;
};
