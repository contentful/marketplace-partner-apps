import type { Meta, StoryObj } from "@storybook/react";

import { SelectFilter as SelectFilterComponent, SelectFilterProps } from ".";

import { useState } from "react";

export default {
    title: "Components/Filters/SelectFilter",
    component: SelectFilterComponent,
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
