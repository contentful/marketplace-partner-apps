import { FieldValues, UseControllerProps } from 'react-hook-form';

export type ControlledCheckboxProps<T extends FieldValues> = UseControllerProps<T> & {
  label: string;
};
