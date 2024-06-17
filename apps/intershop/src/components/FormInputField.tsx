import { FormControl, TextInput } from "@contentful/f36-components";
import React, { ReactNode, KeyboardEvent, CSSProperties } from "react";

interface Props {
  isRequired?: boolean;
  errorMessage?: string;
  label?: string;
  value: string;
  style?: CSSProperties;
  helpText?: ReactNode;
  onChange: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}

const FormField = ({
  isRequired,
  errorMessage,
  label,
  value,
  helpText,
  onChange,
  onKeyDown,
  style,
}: Props) => (
  <FormControl
    isRequired={isRequired}
    isInvalid={errorMessage ? errorMessage !== "" : false}
    style={{ width: "100%", ...style }}
  >
    <FormControl.Label>{label}</FormControl.Label>
    <FormControl.HelpText>{helpText}</FormControl.HelpText>
    <TextInput
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) =>
        onKeyDown && onKeyDown(event as KeyboardEvent<HTMLInputElement>)
      }
    />
    {errorMessage && (
      <FormControl.ValidationMessage>
        {errorMessage}
      </FormControl.ValidationMessage>
    )}
  </FormControl>
);

export default FormField;
