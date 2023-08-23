import { EntryFieldAPI } from '@contentful/app-sdk';
import { FormControl } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { forwardRef } from 'react';

export interface FieldSelectionProps {
  selectedFields: EntryFieldAPI[];
  richTextFields: EntryFieldAPI[];
  toggleSelection: (field: EntryFieldAPI) => void;
  isSelected: (fields: EntryFieldAPI) => boolean;
}

export const FieldSelection = forwardRef<HTMLDivElement, FieldSelectionProps>(({ selectedFields, richTextFields, toggleSelection, isSelected }, ref) => {
  return (
    <div ref={ref}>
      <FormControl>
        <FormControl.Label>Choose the input fields:</FormControl.Label>
        <Multiselect currentSelection={selectedFields.map((field) => field.name)}>
          {richTextFields.map((field) => (
            <Multiselect.Option
              key={field.id}
              value={field.id}
              itemId={field.id}
              label={field.name}
              onSelectItem={() => {
                toggleSelection(field);
              }}
              isChecked={isSelected(field)}
            />
          ))}
        </Multiselect>
      </FormControl>
    </div>
  );
});
