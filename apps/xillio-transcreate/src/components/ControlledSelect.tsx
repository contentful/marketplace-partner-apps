import { FormControl, Select } from "@contentful/f36-components";
import { cx } from '@emotion/css';
import { FieldValues, UseControllerProps, useController } from "react-hook-form";
import { colorGray } from "../styles";

export type SelectOption = {
    label: string;
    value: string;
};

export type ControlledSelectProps<T extends FieldValues> = UseControllerProps<T> & {
    options: SelectOption[];
    label: string;
    helpText?: string;
};

export const ControlledSelect = <T extends FieldValues>({
    options,
    label,
    helpText,
    ...props
}: ControlledSelectProps<T>) => {
    const {
        field: { ref, ...inputProps },
        fieldState: { error },
    } = useController(props);

    return (
        <FormControl isInvalid={Boolean(error)} marginBottom="none">
            <FormControl.Label isRequired className={cx({ [colorGray]: inputProps.disabled })}>
                {label}
            </FormControl.Label>

            <Select {...inputProps} ref={ref} isDisabled={inputProps.disabled}>
                {options.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                        {option.label}
                    </Select.Option>
                ))}
            </Select>

            {helpText && <FormControl.HelpText>{helpText}</FormControl.HelpText>}

            {error && (
                <FormControl.ValidationMessage>{error?.message?.toString()}</FormControl.ValidationMessage>
            )}
        </FormControl>
    );
};
