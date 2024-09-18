import type { Meta, StoryObj } from "@storybook/react";
import { ControlledMultiSelect as ControlledMultiSelectComponent, ControlledMultiSelectProps } from ".";

import { userEvent, within, expect } from "@storybook/test";
import { useForm } from "react-hook-form";

type FieldValues = {
    multiSelect: string[];
};

export default {
    title: "Components/Form/ControlledMultiSelect",
    component: ControlledMultiSelectComponent,
    parameters: {
        controls: {
            include: ["label", "helpText"],
        },
    },
    args: {
        name: "multiSelect",
        label: "Try out this multi select!",
        helpText: "This is a help text.",
        options: {
            "option-1": "Option 1",
            "option-2": "Option 2",
            "option-3": "Option 3",
        },
    },
    render: (args) => {
        const { control } = useForm<FieldValues>({
            defaultValues: {
                multiSelect: [],
            },
        });

        return <ControlledMultiSelectComponent {...args} control={control} />;
    },
} satisfies Meta<ControlledMultiSelectProps<FieldValues>>;

type Story = StoryObj<ControlledMultiSelectProps<FieldValues>>;

export const Enabled: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const body = within(document.body);

        expect(canvas.queryByText(args.label)).toBeInTheDocument();
        if (args.helpText) expect(canvas.queryByText(args.helpText)).toBeInTheDocument();

        const select = canvas.getByRole("button", { name: "add locale" });

        for (const key in args.options) {
            await userEvent.click(select);

            const option = body.getByRole("menuitem", { name: args.options[key] });

            expect(canvas.queryByText(args.options[key])).not.toBeInTheDocument();

            await userEvent.click(option);

            expect(canvas.getByText(args.options[key])).toBeInTheDocument();

            await userEvent.click(canvas.getByRole("button", { name: "Close" }));
        }

        await userEvent.click(select);

        await userEvent.click(body.getByRole("menuitem", { name: "Select All" }));

        for (const key in args.options) {
            expect(canvas.getByText(args.options[key])).toBeInTheDocument();
        }

        const closeButtons = canvas.getAllByRole("button", { name: "Close" });

        for (const closeButton of closeButtons) {
            await userEvent.click(closeButton);
        }

        for (const key in args.options) {
            expect(canvas.queryByText(args.options[key])).not.toBeInTheDocument();
        }
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const body = within(document.body);

        expect(canvas.queryByText(args.label)).toBeInTheDocument();
        if (args.helpText) expect(canvas.queryByText(args.helpText)).toBeInTheDocument();

        const select = canvas.getByRole("button", { name: "add locale" });

        for (const key in args.options) {
            await userEvent.click(select);

            expect(body.queryByRole("menuitem", { name: args.options[key] })).not.toBeInTheDocument();
        }

        await userEvent.click(select);

        expect(body.queryByRole("menuitem", { name: "Select All" })).not.toBeInTheDocument();

        for (const key in args.options) {
            expect(canvas.queryByText(args.options[key])).not.toBeInTheDocument();
        }
    },
};
