import { Flex, FormControl, IconButton, Menu, Pill } from "@contentful/f36-components";
import { css, cx } from "emotion";
import { FieldValues, UseControllerProps, useController } from "react-hook-form";
import { colorGray } from "../styles";
import { PlusIcon } from "@contentful/f36-icons";
import { useMemo } from "react";

export type MultiSelectOptions = {
    [value: string]: string;
};

export type ControlledMultiSelectProps<T extends FieldValues> = Omit<UseControllerProps<T>, "rules"> & {
    options: MultiSelectOptions;
    label: string;
    helpText?: string;
    minSelect?: {
        value: number;
        message: string;
    };
};

// TODO: create storybook stories for all components
/*
{
    nl: "Dutch",
    "en-US": "English (US)",
    "en-UK": "English (UK)",
    dk: "Danish",
    af: "Afrikaans",
    "zh-cn": "Chinese (China)",
}
*/

export const ControlledMultiSelect = <T extends FieldValues>({
    options,
    label,
    helpText,
    minSelect,
    ...props
}: ControlledMultiSelectProps<T>) => {
    const rules = minSelect
        ? {
              validate: (selected: string[]) => selected.length >= minSelect.value || minSelect.message,
          }
        : {};
    const {
        field: { disabled, value: selected, onChange },
        fieldState: { error },
    } = useController({ ...props, rules });

    const unselected = useMemo(
        () => Object.keys(options).filter((value) => !selected.includes(value)),
        [selected, options],
    );

    const handleSelectOption = (value: string) => {
        onChange([...selected, value]);
    };

    const handleDeselectOption = (value: string) => {
        onChange(selected.filter((selectedValue: string) => selectedValue !== value));
    };

    const handleSelectAll = () => {
        onChange([...selected, ...unselected]);
    };

    return (
        <FormControl isRequired isInvalid={Boolean(error)} marginBottom="none">
            <FormControl.Label className={cx({ [colorGray]: disabled })}>{label}</FormControl.Label>

            <Flex flexWrap="wrap" gap="spacingXs" className={css({ minHeight: 40 })}>
                {Boolean(unselected.length) && (
                    <Menu isAutoalignmentEnabled={false} placement="top-start">
                        <Menu.Trigger>
                            <IconButton
                                variant="secondary"
                                icon={<PlusIcon />}
                                aria-label="add locale"
                                isDisabled={disabled}
                            />
                        </Menu.Trigger>
                        <Menu.List style={{ overflow: "auto", maxHeight: "13rem" }}>
                            <Menu.Item onClick={handleSelectAll}>Select All</Menu.Item>
                            <Menu.Divider />
                            {unselected.map((value) => (
                                <Menu.Item key={value} onClick={() => handleSelectOption(value)}>
                                    {options[value]}
                                </Menu.Item>
                            ))}
                        </Menu.List>
                    </Menu>
                )}

                {selected.map((value: string) => (
                    <Pill key={value} label={options[value]} onClose={() => handleDeselectOption(value)} />
                ))}
            </Flex>

            {helpText && <FormControl.HelpText>{helpText}</FormControl.HelpText>}

            {error && (
                <FormControl.ValidationMessage>{error?.message?.toString()}</FormControl.ValidationMessage>
            )}
        </FormControl>
    );
};
