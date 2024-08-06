import type { Meta, StoryObj } from "@storybook/react";

import { SearchBar as SearchBarComponent, SearchBarProps } from ".";
import { Box, GlobalStyles, Menu } from "@contentful/f36-components";
import tokens from "@contentful/f36-tokens";
import { css } from '@emotion/css';
import { CalendarFilter, CalendarFilterCondition } from "../CalendarFilter";
import { useState } from "react";
import { MultiSelectFilter } from "../MultiSelectFilter";

export default {
    title: "Components/SearchBar",
    component: SearchBarComponent,
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
            />
        );
    },
};
