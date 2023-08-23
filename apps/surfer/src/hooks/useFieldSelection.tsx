import { EntryFieldAPI } from '@contentful/app-sdk';
import { useCallback, useMemo, useState } from 'react';
import { FieldSelection } from '../components/FieldSelection';

export const useFieldSelection = (entryFields: EntryFieldAPI[]) => {
  const richTextFields = useMemo(() => Object.values(entryFields).filter((field) => field.type === 'RichText'), [entryFields]);
  const [selectedFields, setSelectedFields] = useState<EntryFieldAPI[]>(richTextFields);

  const isSelected = useCallback((field: EntryFieldAPI) => selectedFields.some((selectedField) => selectedField.id === field.id), [selectedFields]);

  const toggleSelection = useCallback(
    (field?: EntryFieldAPI) => {
      if (field && isSelected(field)) {
        return setSelectedFields((selectedFields) => selectedFields.filter((selectedField) => selectedField.id !== field.id));
      } else if (field) {
        setSelectedFields((selectedFields) => [...selectedFields, field]);
      }
    },
    [isSelected]
  );

  const SelectionComponent =
    richTextFields.length > 1
      ? () => <FieldSelection selectedFields={selectedFields} richTextFields={richTextFields} toggleSelection={toggleSelection} isSelected={isSelected} />
      : () => null;

  return [selectedFields, SelectionComponent, richTextFields] as const;
};
