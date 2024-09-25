import { FormControl, Textarea } from '@contentful/f36-components';
import { FieldValues, UseControllerProps, useController } from 'react-hook-form';
import { colorGray } from '../../styles';
import { useMemo } from 'react';
import { ControlledTextAreaProps } from './ControlledTextArea.types';

export const ControlledTextArea = <T extends FieldValues>({ label, helpText, placeholder, isRequired, ...props }: ControlledTextAreaProps<T>) => {
  const rules = useMemo(() => {
    const res: UseControllerProps<T>['rules'] = {};
    if (isRequired) res.required = 'This field is required';
    return res;
  }, [isRequired]);
  const {
    field: { ref, ...inputProps },
    fieldState: { error },
  } = useController({ ...props, rules });

  return (
    <FormControl isInvalid={Boolean(error)} marginBottom="none">
      <FormControl.Label isRequired={isRequired} css={[inputProps.disabled && colorGray]}>
        {label}
      </FormControl.Label>

      <Textarea {...inputProps} ref={ref} isDisabled={inputProps.disabled} placeholder={placeholder} />

      {helpText && <FormControl.HelpText>{helpText}</FormControl.HelpText>}

      {error && <FormControl.ValidationMessage>{error?.message?.toString()}</FormControl.ValidationMessage>}
    </FormControl>
  );
};
