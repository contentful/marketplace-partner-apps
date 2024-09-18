import type { Meta, StoryObj } from "@storybook/react";
import { ControlledSelect as ControlledSelectComponent, ControlledSelectProps } from ".";

import { userEvent, within, expect } from "@storybook/test";
import { useForm } from "react-hook-form";

type FieldValues = {
    select: string;
};

export default {
    title: "Components/Form/ControlledSelect",
    component: ControlledSelectComponent,
    parameters: {
        controls: {
            include: ["label", "helpText"],
        },
    },
    args: {
        name: "select",
        label: "Try out this select!",
        helpText: "This is a help text.",
        options: [
            { label: "Option 1", value: "option-1" },
            { label: "Option 2", value: "option-2" },
            { label: "Option 3", value: "option-3" },
        ],
    },
    render: (args) => {
        const { control } = useForm<FieldValues>();

        return <ControlledSelectComponent {...args} control={control} />;
    },
} satisfies Meta<ControlledSelectProps<FieldValues>>;

type Story = StoryObj<ControlledSelectProps<FieldValues>>;

export const Enabled: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        expect(canvas.queryByText(args.label)).toBeInTheDocument();
        if (args.helpText) expect(canvas.queryByText(args.helpText)).toBeInTheDocument();

        const select = canvas.getByRole("combobox");

        for (const option of args.options) {
            await userEvent.selectOptions(select, option.value);

            expect(select).toHaveValue(option.value);
        }
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        expect(canvas.queryByText(args.label)).toBeInTheDocument();
        if (args.helpText) expect(canvas.queryByText(args.helpText)).toBeInTheDocument();

        const select = canvas.getByRole("combobox");

        for (const option of args.options) {
            await userEvent.selectOptions(select, option.value);

            expect(select).toHaveValue(args.options[0].value);
        }
    },
};
