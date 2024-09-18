import type { Meta, StoryObj } from "@storybook/react";
import { Filter as FilterComponent, FilterProps } from ".";

import { useState } from "react";
import { fn, userEvent, within, expect } from "@storybook/test";

export default {
    title: "Components/Filters/Filter",
    component: FilterComponent,
    parameters: {
        controls: {
            include: ["name", "value"],
        },
    },
} satisfies Meta<typeof FilterComponent>;

type Story = StoryObj<FilterProps>;

export const Enabled: Story = {
    args: {
        name: "Changes",
        value: "Yes",
        onClick: fn(),
    },
    argTypes: {
        value: { options: ["Yes", "No"], control: { type: "select" } },
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText(args.name)).toBeInTheDocument();

        const button = canvas.getByRole("button", { name: args.value });

        expect(args.onClick).toHaveBeenCalledTimes(0);

        await userEvent.click(button);

        expect(args.onClick).toHaveBeenCalledTimes(1);
    },
};

export const Disabled: Story = {
    args: {
        name: "Changes",
        value: "Yes",
        onClick: fn(),
        isDisabled: true,
    },
    argTypes: {
        value: { options: ["Yes", "No"], control: { type: "select" } },
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText(args.name)).toBeInTheDocument();

        const button = canvas.getByRole("button", { name: args.value });

        expect(args.onClick).toHaveBeenCalledTimes(0);

        await userEvent.click(button);

        expect(args.onClick).toHaveBeenCalledTimes(0);
    },
};

const setSelectedMock = fn();

type ConditionValue =
    | "is"
    | "is greater than"
    | "is greater than or equal to"
    | "is less than"
    | "is less than or equal to";

export const EnabledWithCondition: Story = {
    args: {
        name: "Updated at",
        value: new Date().toLocaleDateString(),
        onClick: fn(),
    },
    render: (args) => {
        const [selected, _setSelected] = useState<ConditionValue>("is");

        const setSelected = (selected: ConditionValue) => {
            setSelectedMock(selected);
            _setSelected(selected);
        };

        return (
            <FilterComponent
                {...args}
                conditions={{
                    options: [
                        "is",
                        "is greater than",
                        "is greater than or equal to",
                        "is less than",
                        "is less than or equal to",
                    ],
                    selected,
                    onSelect: setSelected,
                }}
            />
        );
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText(args.name)).toBeInTheDocument();

        const button = canvas.getByRole("button", { name: args.value });

        expect(args.onClick).toHaveBeenCalledTimes(0);

        await userEvent.click(button);

        expect(args.onClick).toHaveBeenCalledTimes(1);

        const body = within(document.body);

        expect(canvas.queryByText("is")).toBeInTheDocument();
        expect(canvas.queryByText("is greater than")).not.toBeInTheDocument();

        await userEvent.click(canvas.getByText("is"));
        await userEvent.click(body.getByText("is greater than"));

        expect(canvas.queryByText("is")).not.toBeInTheDocument();
        expect(canvas.queryByText("is greater than")).toBeInTheDocument();
        expect(setSelectedMock).toHaveBeenCalledTimes(1);
        expect(setSelectedMock).toHaveBeenCalledWith("is greater than");
    },
};

export const DisabledWithCondition: Story = {
    args: {
        name: "Updated at",
        value: new Date().toLocaleDateString(),
        onClick: fn(),
        isDisabled: true,
    },
    render: (args) => {
        const [selected, _setSelected] = useState<ConditionValue>("is");

        const setSelected = (selected: ConditionValue) => {
            setSelectedMock(selected);
            _setSelected(selected);
        };

        return (
            <FilterComponent
                {...args}
                conditions={{
                    options: [
                        "is",
                        "is greater than",
                        "is greater than or equal to",
                        "is less than",
                        "is less than or equal to",
                    ],
                    selected,
                    onSelect: setSelected,
                }}
            />
        );
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText(args.name)).toBeInTheDocument();

        const button = canvas.getByRole("button", { name: args.value });

        expect(args.onClick).toHaveBeenCalledTimes(0);

        await userEvent.click(button);

        expect(args.onClick).toHaveBeenCalledTimes(0);

        const body = within(document.body);

        expect(canvas.queryByText("is")).toBeInTheDocument();
        expect(canvas.queryByText("is greater than")).not.toBeInTheDocument();

        await userEvent.click(canvas.getByText("is"));

        expect(body.queryByText("is greater than")).not.toBeInTheDocument();
    },
};
