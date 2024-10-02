import { HTMLInputTypeAttribute } from 'react';
import { FieldValues, UseControllerProps } from 'react-hook-form';

export type ControlledTextAreaProps<T extends FieldValues> = Omit<UseControllerProps<T>, 'rules'> & {
  label: string;
  helpText?: string;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  isRequired?: boolean;
};
