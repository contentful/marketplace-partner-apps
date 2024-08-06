import type { Meta, StoryObj } from "@storybook/react";
import { SearchBar as SearchBarComponent, SearchBarProps } from ".";
import { Box, GlobalStyles, Text } from "@contentful/f36-components";
import tokens from "@contentful/f36-tokens";
import { css } from '@emotion/css';
import { useEffect, useState } from "react";

export default {
    title: "Locations/Page",
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
    render: () => {
        const [search, setSearch] = useState("");

        return (
            <SearchBarComponent
                search={search}
                onSearch={setSearch}
                contentTypeOptions={{
                    recipe: "Recipe",
                    page: "Page",
                }}
                userOptions={{
                    john: "John",
                    jane: "Jane",
                }}
                onFilterChange={console.log}
            />
        );
    },
};
