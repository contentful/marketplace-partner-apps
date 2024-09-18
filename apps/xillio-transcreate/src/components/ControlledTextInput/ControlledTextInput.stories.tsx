import type { Meta, StoryObj } from "@storybook/react";
import { ControlledTextInput as ControlledTextInputComponent, ControlledTextInputProps } from ".";

import { userEvent, within, expect } from "@storybook/test";
import { useForm } from "react-hook-form";

type FieldValues = {
    input: boolean;
};

export default {
    title: "Components/Form/ControlledTextInput",
    component: ControlledTextInputComponent,
    parameters: {
        controls: {
            include: ["label", "helpText"],
        },
    },
    args: {
        name: "input",
        label: "Try out this text input!",
        helpText: "This is a help text.",
    },
    render: (args) => {
        const { control } = useForm<FieldValues>();

        return <ControlledTextInputComponent {...args} control={control} />;
    },
} satisfies Meta<ControlledTextInputProps<FieldValues>>;

type Story = StoryObj<ControlledTextInputProps<FieldValues>>;

export const Enabled: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        expect(canvas.queryByText(args.label)).toBeInTheDocument();
        if (args.helpText) expect(canvas.queryByText(args.helpText)).toBeInTheDocument();

        const input = canvas.getByRole("textbox");

        expect(input).toHaveValue("");

        await userEvent.type(input, "Hello, world!");

        expect(input).toHaveValue("Hello, world!");
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

        const input = canvas.getByRole("textbox");

        expect(input).toHaveValue("");

        await userEvent.type(input, "Hello, world!");

        expect(input).toHaveValue("");
    },
};
