import { FocusEvent, ChangeEvent, useCallback, useState, FunctionComponent } from 'react';

import { EntryFieldAPI } from '@contentful/app-sdk';
import { TextInput } from '@contentful/f36-components';
import { debounce } from 'lodash';

interface IAutoSaveTextInputProps {
  field: EntryFieldAPI | undefined;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  isInvalid?: boolean;
  isDisabled?: boolean;
}

const save = async (props: IAutoSaveTextInputProps, value: string) => {
  if (!props.isInvalid && props.field) {
    await props.field.setValue(value);
    if (props.onSave) {
      props.onSave(value);
    }
  }
};

const debouncedSave = debounce(save, 300);

export const AutoSaveTextInput: FunctionComponent<IAutoSaveTextInputProps> = (props) => {
  const [value, setValue] = useState<string>(props.field?.getValue() ?? '');

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setValue(value);
      if (props.onChange) {
        props.onChange(value);
      }
      debouncedSave.cancel();
      debouncedSave(props, value);
    },
    [props],
  );

  const handleBlur = useCallback(
    async (e: FocusEvent<HTMLInputElement>) => {
      const value = e.target.value;
      await save(props, value);
    },
    [props],
  );

  return (
    <TextInput
      onChange={handleChange}
      onBlur={handleBlur}
      value={value}
      isInvalid={props.isInvalid}
      isDisabled={props.isDisabled}
    />
  );
};
