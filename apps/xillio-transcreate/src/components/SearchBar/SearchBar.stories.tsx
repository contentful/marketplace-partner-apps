import type { Meta, StoryObj } from "@storybook/react";

import { SearchBar as SearchBarComponent, SearchBarProps } from ".";
import { Menu } from "@contentful/f36-components";
import { CalendarFilter, CalendarFilterCondition } from "../CalendarFilter";
import { useState } from "react";
import { MultiSelectFilter } from "../MultiSelectFilter";

export default {
    title: "Components/SearchBar",
    component: SearchBarComponent,
} satisfies Meta<typeof SearchBarComponent>;

type Story = StoryObj<SearchBarProps>;

export const SearchBar: Story = {
    args: {},
    render: () => {
        const [search, setSearch] = useState("");
        const [contentTypes, setContentTypes] = useState<Set<"recipe" | "page">>(new Set());
        const [date, setDate] = useState<Date | null>(null);
        const [condition, setCondition] = useState<CalendarFilterCondition>("is");

        return (
            <SearchBarComponent
                search={search}
                onSearch={setSearch}
                filterMenuItems={[<Menu.Item>Content Type</Menu.Item>, <Menu.Item>Updated at</Menu.Item>]}
                filters={[
                    <MultiSelectFilter
                        name="Content type"
                        options={{
                            recipe: "Recipe",
                            page: "Page",
                        }}
                        selected={contentTypes}
                        onSelect={setContentTypes}
                    />,
                    <CalendarFilter
                        name="Updated at"
                        date={date}
                        onDate={setDate}
                        condition={condition}
                        onCondition={setCondition}
                    />,
                ]}
                onBackSpace={() => {}}
            />
        );
    },
};
