import { EntryFieldAPI } from '@contentful/app-sdk';
import { ContentTypeProps, ContentFields } from 'contentful-management';
import { useMemo } from 'react';
import { ContentTypeId, ContentFieldsMap } from '../types';

export const isRichText = (field: ContentFields | EntryFieldAPI) => field.type === 'RichText';
const onlyContainingRichText = (contentTypes: ContentTypeProps[]) => contentTypes.filter((type) => !!type.fields.find(isRichText));

export interface SurferCompatibility {
  compatibleContentTypes: ContentTypeId[];
  compatibleFields: ContentFieldsMap;
}

export const useSurferCompatibility = (contentTypes?: ContentTypeProps[]) => {
  const compatibility = useMemo<SurferCompatibility | undefined>(() => {
    if (!contentTypes) {
      return;
    }
    const contentTypesWithRichTextFields = onlyContainingRichText(contentTypes);
    const compatibleContentTypes = contentTypesWithRichTextFields.map(({ sys: { id } }) => id);
    const compatibleFields = contentTypesWithRichTextFields.reduce<ContentFieldsMap>((acc, { sys: { id }, fields }) => {
      acc[id] = fields.filter(isRichText).map((field) => field.id);

      return acc;
    }, {});

    return { compatibleContentTypes, compatibleFields };
  }, [contentTypes]);

  return compatibility;
};
