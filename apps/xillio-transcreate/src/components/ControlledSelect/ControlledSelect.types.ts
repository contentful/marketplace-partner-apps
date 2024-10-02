import { FieldValues, UseControllerProps } from 'react-hook-form';

export type SelectOption = {
  label: string;
  value: string;
};

export type ControlledSelectProps<T extends FieldValues> = UseControllerProps<T> & {
  options: SelectOption[];
  label: string;
  helpText?: string;
};
