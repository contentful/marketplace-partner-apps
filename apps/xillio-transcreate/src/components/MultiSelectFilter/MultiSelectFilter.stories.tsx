import type { Meta, StoryObj } from "@storybook/react";

import { MultiSelectFilter as MultiSelectFilterComponent, MultiSelectFilterProps } from ".";
import { Box, GlobalStyles } from "@contentful/f36-components";
import tokens from "@contentful/f36-tokens";
import { css } from '@emotion/css';
import { useState } from "react";

export default {
    title: "Components/MultiSelectFilter",
    component: MultiSelectFilterComponent,
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
} satisfies Meta<typeof MultiSelectFilterComponent>;

type MultiSelectFilterValue =
    | "recipe"
    | "page"
    | "blog"
    | "ingredients"
    | "foo"
    | "bar"
    | "baz"
    | "veryVeryVeryVeryVeryVeryVeryVeryVeryLongName"
    | "more"
    | "moore"
    | "mooore"
    | "moooore"
    | "pls"
    | "show"
    | "the"
    | "damn"
    | "scrollbar";

type Story = StoryObj<MultiSelectFilterProps<MultiSelectFilterValue>>;

export const MultiSelectFilter: Story = {
    args: {
        name: "Content type",
        options: {
            recipe: "Recipe",
            page: "Page",
            blog: "Blog",
            ingredients: "Ingredients",
            foo: "Foo",
            bar: "Bar",
            baz: "Baz",
            veryVeryVeryVeryVeryVeryVeryVeryVeryLongName:
                "Very Very Very Very Very Very Very Very Very Long Name",
            more: "More",
            moore: "Moore's law",
            mooore: "Wow this is getting out of hand",
            moooore: "MOOOOOOOOOOREEE!",
            pls: "Please",
            show: "Show",
            the: "The",
            damn: "Damn",
            scrollbar: "Scrollbar",
        },
    },
    render: (args) => {
        const [selected, setSelected] = useState<Set<MultiSelectFilterValue>>(new Set());

        return <MultiSelectFilterComponent {...args} selected={selected} onSelect={setSelected} />;
    },
};
