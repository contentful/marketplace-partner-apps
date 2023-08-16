import { TextInput, TextInputProps } from '@contentful/f36-components';
import { ReactNode, useId } from 'react';
import { FieldWrapper } from './FieldWrapper';

interface Props {
  name: string;
  description: ReactNode;

  value: string;
  onChange: (value: string) => void;

  isRequired?: boolean;
  type: 'text' | 'number';

  inputProps?: Pick<TextInputProps, 'max' | 'min'>;
  testId: string;
}

export function TextField({ name, description, value, onChange, isRequired = false, type, inputProps, testId }: Props) {
  return (
    <FieldWrapper name={name} description={description} counter>
      <TextInput
        name={useId()}
        width={type === 'text' ? 'large' : 'medium'}
        type={type}
        maxLength={255}
        isRequired={isRequired}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        testId={testId}
        {...inputProps}
      />
    </FieldWrapper>
  );
}
