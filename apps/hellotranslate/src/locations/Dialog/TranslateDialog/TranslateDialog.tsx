import { Button, Flex, Note } from "@contentful/f36-components";
import {
    ControlledCheckbox,
    ControlledDatepicker,
    ControlledMultiSelect,
    ControlledSelect,
    ControlledTextArea,
    ControlledTextInput,
    MultiSelectOptions,
    SelectOption,
} from "../../../components";
import { useForm } from "react-hook-form";
import { appConfig } from "../../../appConfig";
import { useMemo } from "react";

export type TranslationJobFormData = {
    submitter: string;
    projectName: string;
    translationJobName: string;
    locales: string[];
    sendRecursively: boolean;
    dueDate: Date;
    description: string;
};

export type TranslateDialogProps = {
    defaultValues: Pick<
        TranslationJobFormData,
        "submitter" | "projectName" | "translationJobName" | "sendRecursively" | "locales"
    >;
    projectOptions: SelectOption[];
    localeOptions?: MultiSelectOptions;
    onClose: (data?: any) => void;
};

export const TranslateDialog = ({
    defaultValues,
    projectOptions,
    localeOptions,
    onClose,
}: TranslateDialogProps) => {
    const { control, handleSubmit } = useForm<TranslationJobFormData>({
        defaultValues: {
            ...defaultValues,
            description: "",
        },
    });

    const note = useMemo(() => {
        if (!projectOptions.length)
            return `No projects found. Please configure at least one project in ${appConfig.name}`;
        if (localeOptions && !Object.keys(localeOptions).length)
            return "No locales found. Please configure at least one additional locale in your environment settings.";
        if (!localeOptions && !defaultValues.locales.length)
            return "No locales selected. Please select at least one locale.";
    }, [projectOptions, localeOptions]);

    const isDisabled = Boolean(note);

    return (
        <Flex flexDirection="column" gap="spacingM" padding="spacingM">
            {note && <Note variant="negative">{note}</Note>}
            <ControlledSelect
                control={control}
                label="Project"
                name="projectName"
                options={projectOptions}
                helpText={`Select the ${appConfig.name} project to use`}
                disabled={isDisabled}
            />

            <ControlledTextInput
                control={control}
                label="Translation job name"
                name="translationJobName"
                helpText="Provide a name for the translation job"
                isRequired
                disabled={isDisabled}
            />

            <ControlledTextArea
                control={control}
                label="Description"
                name="description"
                helpText="Provide a description for the translation job"
                disabled={isDisabled}
            />

            <ControlledCheckbox
                control={control}
                label="Send all references recursively with entry"
                name="sendRecursively"
                disabled={isDisabled}
            />

            {localeOptions && (
                <ControlledMultiSelect
                    control={control}
                    label="Locales"
                    name="locales"
                    minSelect={{
                        value: 1,
                        message: "Select at least one locale",
                    }}
                    options={localeOptions}
                    disabled={isDisabled}
                />
            )}

            <ControlledDatepicker
                control={control}
                label="Due date"
                name="dueDate"
                isRequired
                disabled={isDisabled}
            />

            <ControlledTextInput
                control={control}
                label="Submitter"
                name="submitter"
                isRequired
                disabled={isDisabled}
            />

            <Flex justifyContent="flex-end" gap="spacingS">
                <Button size="small" onClick={() => onClose()}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    size="small"
                    onClick={handleSubmit(onClose)}
                    isDisabled={isDisabled}
                >
                    Translate
                </Button>
            </Flex>
        </Flex>
    );
};
