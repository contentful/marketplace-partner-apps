import type { Meta, StoryObj } from "@storybook/react";

import { CalendarFilter as CalendarFilterComponent, CalendarFilterCondition, CalendarFilterProps } from ".";
import { Box, GlobalStyles } from "@contentful/f36-components";
import tokens from "@contentful/f36-tokens";
import { css } from '@emotion/css';
import { useState } from "react";

export default {
    title: "Components/CalendarFilter",
    component: CalendarFilterComponent,
    decorators: [
        (Story) => (
            <>
                <GlobalStyles />
                <Box
                    padding="spacingL"
                    className={css({
                        backgroundColor: tokens.gray100,
                        position: "fixed",
                        inset: 0,
                        padding: "1rem",
                    })}
                >
                    <Story />
                </Box>
            </>
        ),
    ],
} satisfies Meta<typeof CalendarFilterComponent>;

type Story = StoryObj<CalendarFilterProps>;

export const CalendarFilter: Story = {
    args: {
        name: "Updated at",
    },
    render: (args) => {
        const [date, setDate] = useState<Date | null>(null);
        const [condition, setCondition] = useState<CalendarFilterCondition>("is");

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
};
