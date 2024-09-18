import type { Meta, StoryObj } from "@storybook/react";

import { CalendarFilter as CalendarFilterComponent, CalendarFilterCondition, CalendarFilterProps } from ".";

import { useState } from "react";
import { fn, userEvent, within, expect, Mock } from "@storybook/test";

export default {
    title: "Components/Filters/CalendarFilter",
    component: CalendarFilterComponent,
    parameters: {
        controls: {
            include: ["name"],
        },
    },
    args: {
        name: "Updated at",
        onDate: fn(),
        onCondition: fn(),
    },

    render: ({ onDate, onCondition, ...args }) => {
        const [date, _setDate] = useState<Date | null>(null);
        const [condition, _setCondition] = useState<CalendarFilterCondition>("is");

        const setDate = (date: Date | null) => {
            onDate(date);
            _setDate(date);
        };

        const setCondition = (condition: CalendarFilterCondition) => {
            onCondition(condition);
            _setCondition(condition);
        };

        return (
            <CalendarFilterComponent
                {...args}
                date={date}
                onDate={setDate}
                condition={condition}
                onCondition={setCondition}
            />
        );
    },
} satisfies Meta<typeof CalendarFilterComponent>;

type Story = StoryObj<
    Omit<CalendarFilterProps, "onDate" | "onCondition"> & {
        onDate: Mock<[Date | null]>;
        onCondition: Mock<[CalendarFilterCondition]>;
    }
>;

export const Enabled: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        // check if name is displayed
        expect(canvas.getByText(args.name)).toBeInTheDocument();

        expect(args.onDate).toHaveBeenCalledTimes(0);
        expect(args.onCondition).toHaveBeenCalledTimes(0);

        // select date
        const selectDateButton = canvas.getByText("Select date");

        await userEvent.click(selectDateButton);

        const body = within(document.body);

        await userEvent.selectOptions(body.getByLabelText("Month:"), "January");
        await userEvent.selectOptions(body.getByLabelText("Year:"), "2022");
        await userEvent.click(body.getByRole("gridcell", { name: "1" }));

        const date = new Date(2022, 0, 1);
        expect(canvas.queryByText("Select date")).not.toBeInTheDocument();
        expect(canvas.queryByText(date.toLocaleDateString())).toBeInTheDocument();
        expect(args.onDate).toHaveBeenCalledTimes(1);
        expect(args.onCondition).toHaveBeenCalledTimes(0);

        // `expect(args.onDate).toHaveBeenCalledWith(date)` does NOT work at all
        // even passing `args.onDate.mock.calls[0][0]` to `expect` does not work, gives the same error
        // TODO: try out `mockdate` npm package: https://storybook.js.org/docs/writing-tests/interaction-testing#run-code-before-the-component-gets-rendered
        expect(args.onDate.mock.calls[0][0]?.toLocaleDateString()).toEqual(date.toLocaleDateString());

        // set condition
        expect(canvas.queryByText("is")).toBeInTheDocument();
        expect(canvas.queryByText("is greater than")).not.toBeInTheDocument();

        await userEvent.click(canvas.getByText("is"));
        await userEvent.click(body.getByText("is greater than"));

        expect(canvas.queryByText("is")).not.toBeInTheDocument();
        expect(canvas.queryByText("is greater than")).toBeInTheDocument();
        expect(args.onDate).toHaveBeenCalledTimes(1);
        expect(args.onCondition).toHaveBeenCalledTimes(1);
        expect(args.onCondition).toHaveBeenCalledWith("is greater than");
    },
};

export const Disabled: Story = {
    args: {
        isDisabled: true,
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        // check if name is displayed
        expect(canvas.getByText(args.name)).toBeInTheDocument();

        // select date
        const selectDateButton = canvas.getByText("Select date");

        await userEvent.click(selectDateButton);

        const body = within(document.body);

        expect(body.queryByText("Month:")).not.toBeInTheDocument();
        expect(body.queryByText("Year:")).not.toBeInTheDocument();
        expect(body.queryByRole("gridcell", { name: "1" })).not.toBeInTheDocument();

        // set condition
        expect(canvas.queryByText("is")).toBeInTheDocument();
        expect(canvas.queryByText("is greater than")).not.toBeInTheDocument();

        await userEvent.click(canvas.getByText("is"));

        expect(body.queryByText("is greater than")).not.toBeInTheDocument();

        expect(args.onDate).toHaveBeenCalledTimes(0);
        expect(args.onCondition).toHaveBeenCalledTimes(0);
    },
};
