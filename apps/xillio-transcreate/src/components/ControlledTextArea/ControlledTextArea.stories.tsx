import type { Meta, StoryObj } from "@storybook/react";
import { ControlledTextArea as ControlledTextAreaComponent, ControlledTextAreaProps } from ".";

import { userEvent, within, expect } from "@storybook/test";
import { useForm } from "react-hook-form";

type FieldValues = {
    textArea: boolean;
};

export default {
    title: "Components/Form/ControlledTextArea",
    component: ControlledTextAreaComponent,
    parameters: {
        controls: {
            include: ["label", "helpText"],
        },
    },
    args: {
        name: "textArea",
        label: "Try out this text area!",
        helpText: "This is a help text.",
    },
    render: (args) => {
        const { control } = useForm<FieldValues>();

        return <ControlledTextAreaComponent {...args} control={control} />;
    },
} satisfies Meta<ControlledTextAreaProps<FieldValues>>;

type Story = StoryObj<ControlledTextAreaProps<FieldValues>>;

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
