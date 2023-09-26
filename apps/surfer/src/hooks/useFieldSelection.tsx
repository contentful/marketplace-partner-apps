import { useCallback, useState } from 'react';
import { ContentTypeId, ContentFieldsMap, ContentFieldId } from '../types';
import { SurferCompatibility } from './useSurferCompatibility';

export const useFieldSelection = (compatibility: SurferCompatibility = { compatibleFields: {}, compatibleContentTypes: [] }) => {
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentTypeId[]>([]);
  const [selectedContentFields, setSelectedContentFields] = useState<ContentFieldsMap>({});

  const turnContentTypeOff = (id: ContentTypeId) => {
    setSelectedContentTypes((prevState) => prevState.filter((contentTypeId) => contentTypeId !== id));
    setSelectedContentFields((prevState) => {
      delete prevState[id];

      return prevState;
    });
  };

  const turnContentTypeOn = useCallback(
    (id: ContentTypeId, preSelectedFields?: ContentFieldId[]) => {
      setSelectedContentTypes((prevState) => [...prevState, id]);
      setSelectedContentFields((prevState) => {
        prevState[id] = preSelectedFields ?? compatibility.compatibleFields[id];

        return prevState;
      });
    },
    [compatibility.compatibleFields]
  );

  const toggleContentType = (id: ContentTypeId) => {
    if (selectedContentTypes.includes(id)) {
      turnContentTypeOff(id);
    } else {
      turnContentTypeOn(id);
    }
  };

  const toggleField = (contentTypeId: ContentTypeId, fieldId: ContentFieldId) => {
    const currentlySelectedFields = selectedContentFields[contentTypeId];
    const isContentTypeSelected = selectedContentTypes.includes(contentTypeId);
    const isFieldSelected = currentlySelectedFields?.includes(fieldId);

    if (isFieldSelected) {
      if (currentlySelectedFields.length === 1) {
        turnContentTypeOff(contentTypeId);

        return;
      }

      setSelectedContentFields({
        ...selectedContentFields,
        [contentTypeId]: currentlySelectedFields.filter((field) => field !== fieldId),
      });
    } else {
      if (!isContentTypeSelected) {
        turnContentTypeOn(contentTypeId, [fieldId]);

        return;
      }

      setSelectedContentFields({
        ...selectedContentFields,
        [contentTypeId]: [...currentlySelectedFields, fieldId],
      });
    }
  };

  const selectMany = useCallback(
    (ids: ContentTypeId[], preSelectedFields = compatibility.compatibleFields) => {
      const fieldsToSelect = Object.fromEntries(Object.entries(preSelectedFields).filter(([id]) => ids.includes(id as ContentTypeId)));

      setSelectedContentTypes(ids);
      setSelectedContentFields(fieldsToSelect);
    },
    [compatibility]
  );

  const selectAllCompatible = useCallback(() => {
    setSelectedContentTypes([...compatibility.compatibleContentTypes]);
    setSelectedContentFields({ ...compatibility.compatibleFields });
  }, [compatibility]);

  return {
    selectedContentFields,
    selectedContentTypes,
    toggleContentType,
    toggleField,
    selectMany,
    selectAllCompatible,
  };
};
