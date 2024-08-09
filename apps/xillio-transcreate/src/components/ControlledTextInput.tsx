import { FormControl, TextInput } from "@contentful/f36-components";
import { cx } from '@emotion/css';
import { FieldValues, UseControllerProps, useController } from "react-hook-form";
import { colorGray } from "../styles";
import { HTMLInputTypeAttribute, useMemo } from "react";

export type ControlledTextInputProps<T extends FieldValues> = Omit<UseControllerProps<T>, "rules"> & {
    label: string;
    helpText?: string;
    type?: HTMLInputTypeAttribute;
    placeholder?: string;
    isRequired?: boolean;
};

const isValidURL = (value: string) => {
    try {
        const url = new URL(value);
        if (url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost")) {
            return true;
        }
        return "URL must have a protocol of 'https://' or 'http://' with 'localhost' hostname.";
    } catch (error) {
        return "Invalid URL format. Please provide a valid URL.";
    }
};

export const ControlledTextInput = <T extends FieldValues>({
    label,
    helpText,
    type = "text",
    placeholder,
    isRequired,
    ...props
}: ControlledTextInputProps<T>) => {
    const rules = useMemo(() => {
        const res: UseControllerProps<T>["rules"] = {};
        if (isRequired) res.required = "This field is required";
        if (type === "url") res.validate = (value) => isValidURL(value);
        return res;
    }, [isRequired, type]);
    const {
        field: { ref, ...inputProps },
        fieldState: { error },
    } = useController({ ...props, rules });

    return (
        <FormControl isInvalid={Boolean(error)} marginBottom="none">
            <FormControl.Label isRequired={isRequired} className={cx({ [colorGray]: inputProps.disabled })}>
                {label}
            </FormControl.Label>

            <TextInput
                {...inputProps}
                ref={ref}
                isDisabled={inputProps.disabled}
                type={type}
                placeholder={placeholder}
            />

            {helpText && <FormControl.HelpText>{helpText}</FormControl.HelpText>}

            {error && (
                <FormControl.ValidationMessage>{error?.message?.toString()}</FormControl.ValidationMessage>
            )}
        </FormControl>
    );
};
