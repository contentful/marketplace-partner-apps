import { Option, Select } from '@contentful/f36-components';
import { ReactNode, useId } from 'react';
import { FieldWrapper } from './FieldWrapper';

interface Props {
  name: string;
  description: ReactNode;

  value: string;
  onChange: (value: string) => void;

  isRequired: boolean;
  options: string[];
  testId: string;
}

export function SelectField({ name, description, value, onChange, isRequired, options, testId }: Props) {
  return (
    <FieldWrapper name={name} description={description}>
      <Select name={useId()} isRequired={isRequired} onChange={(e) => onChange(e.target.value)} value={value} testId={testId}>
        {options.map((currValue: string) => (
          <Option value={currValue} key={currValue}>
            {currValue}
          </Option>
        ))}
      </Select>
    </FieldWrapper>
  );
}
