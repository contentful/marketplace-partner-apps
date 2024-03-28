import { Flex, Button } from "@contentful/f36-components";
import { useForm } from "react-hook-form";
import { ControlledDatepicker } from "../../../components";

export type UpdateTranslationFormData = {
    dueDate: Date;
};

export type UpdateDialogProps = {
    defaultValues: UpdateTranslationFormData;
    onClose: (data?: any) => void;
};

export const UpdateDialog = ({ defaultValues, onClose }: UpdateDialogProps) => {
    const { control, handleSubmit } = useForm<UpdateTranslationFormData>({
        defaultValues,
    });

    return (
        <Flex flexDirection="column" gap="spacingM" padding="spacingM">
            <ControlledDatepicker control={control} label="Due date" name="dueDate" isRequired />

            <Flex justifyContent="flex-end" gap="spacingS">
                <Button size="small" onClick={() => onClose()}>
                    Cancel
                </Button>
                <Button variant="primary" size="small" onClick={handleSubmit(onClose)}>
                    Update
                </Button>
            </Flex>
        </Flex>
    );
};
