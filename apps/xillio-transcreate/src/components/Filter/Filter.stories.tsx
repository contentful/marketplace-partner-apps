import type { Meta, StoryObj } from "@storybook/react";
import { Filter as FilterComponent, FilterProps } from ".";
import { Box, GlobalStyles } from "@contentful/f36-components";
import tokens from "@contentful/f36-tokens";
import { css } from '@emotion/css';
import { useState } from "react";

export default {
    title: "Components/Filter",
    component: FilterComponent,
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
} satisfies Meta<typeof FilterComponent>;

type Story = StoryObj<FilterProps>;

export const Filter: Story = {
    args: {
        name: "Changes",
        value: "Yes",
    },
};

type ConditionValue =
    | "is"
    | "is greater than"
    | "is greater than or equal to"
    | "is less than"
    | "is less than or equal to";

export const ConditionFilter: Story = {
    args: {
        name: "Updated at",
        value: new Date().toLocaleDateString(),
    },
    render: (args) => {
        const [selected, setSelected] = useState<ConditionValue>("is");

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
};
