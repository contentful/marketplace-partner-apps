import { FormControl, TextInput, IconButton } from "@contentful/f36-components";
import { css } from '@emotion/react';
import { FieldValues, UseControllerProps, useController } from "react-hook-form";
import { colorGray } from "../styles";
import tokens from "@contentful/f36-tokens";
import { CalendarIcon } from "@contentful/f36-icons";
import { useDialog } from "../hooks";
import { useMemo } from "react";

const borderStyle = css({
    borderColor: `${tokens.gray300} !important`,
    boxShadow: "none !important",
});

const hideCursorStyle = css({
    caretColor: "transparent",
});

const enabledStyle = css({
    cursor: "pointer",
});

const disabledStyle = css({
    cursor: "disabled",
});

const invalidStyle = css({
    borderColor: `${tokens.colorNegative} !important`,
});

export type ControlledDatepickerProps<T extends FieldValues> = Omit<UseControllerProps<T>, "rules"> & {
    label: string;
    helpText?: string;
    isRequired?: boolean;
};

export const ControlledDatepicker = <T extends FieldValues>({
    label,
    helpText,
    isRequired,
    ...props
}: ControlledDatepickerProps<T>) => {
    const { open } = useDialog();
    const rules = isRequired ? { required: "Select a date" } : {};
    const {
        field: { disabled: isDisabled, value: selectedDate, onChange },
        fieldState: { error },
    } = useController({ ...props, rules });
    const inputValue = useMemo(() => (selectedDate ? selectedDate.toLocaleDateString() : ""), [selectedDate]);

    const isInvalid = Boolean(error);

    const handleOpen = () =>
        open({
            type: "calendar",
            initialDate: inputValue,
        }).then((date) => {
            if (date instanceof Date) {
                onChange(date);
            }
        });

    return (
        <FormControl isInvalid={isInvalid} isDisabled={isDisabled} marginBottom="none">
            <FormControl.Label isRequired={isRequired} css={[isDisabled && colorGray]}>
                {label}
            </FormControl.Label>

            <TextInput.Group>
                <TextInput
                    css={[
                        hideCursorStyle,
                        borderStyle,
                        isDisabled ? disabledStyle : enabledStyle,
                        isInvalid && invalidStyle,
                    ]}
                    value={inputValue}
                    onClick={handleOpen}
                    aria-label="Choose date"
                    isDisabled={isDisabled}
                />
                <IconButton
                    css={[borderStyle, isInvalid && invalidStyle]}
                    variant="secondary"
                    icon={<CalendarIcon />}
                    onClick={handleOpen}
                    aria-label="Choose date"
                    isDisabled={isDisabled}
                />
            </TextInput.Group>

            {helpText && <FormControl.HelpText>{helpText}</FormControl.HelpText>}

            {error && (
                <FormControl.ValidationMessage>{error?.message?.toString()}</FormControl.ValidationMessage>
            )}
        </FormControl>
    );
};
