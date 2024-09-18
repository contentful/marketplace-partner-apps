import { FieldValues, UseControllerProps } from "react-hook-form";

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
    isAutoalignmentEnabled?: boolean;
    placement?: "top-start" | "top-end" | "bottom-start" | "bottom-end";
};
