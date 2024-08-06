import type { Meta, StoryObj } from "@storybook/react";

import { SelectFilter as SelectFilterComponent, SelectFilterProps } from ".";
import { Box, GlobalStyles } from "@contentful/f36-components";
import tokens from "@contentful/f36-tokens";
import { css } from '@emotion/css';
import { useState } from "react";

export default {
    title: "Components/SelectFilter",
    component: SelectFilterComponent,
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
} satisfies Meta<typeof SelectFilterComponent>;

type SelectFilterValue = "yes" | "no";

type Story = StoryObj<SelectFilterProps<SelectFilterValue>>;

export const SelectFilter: Story = {
    args: {
        name: "Changes",
        options: { yes: "Yes", no: "No" },
    },
    render: (args) => {
        const [selected, setSelected] = useState<SelectFilterValue>("yes");

        return <SelectFilterComponent {...args} selected={selected} onSelect={setSelected} />;
    },
};
