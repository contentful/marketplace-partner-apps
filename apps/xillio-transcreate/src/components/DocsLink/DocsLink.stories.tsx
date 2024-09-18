import type { Meta, StoryObj } from "@storybook/react";
import { DocsLink as DocsLinkComponent, DocsLinkProps } from ".";

import { within, expect } from "@storybook/test";
import { appConfig } from "../../appConfig";

export default {
    title: "Components/Data Display/DocsLink",
    component: DocsLinkComponent,
    parameters: {
        controls: {
            include: ["path", "children"],
        },
    },
} satisfies Meta<typeof DocsLinkComponent>;

type Story = StoryObj<DocsLinkProps>;

export const DocsLink: Story = {
    args: {
        path: "/",
        children: "Test docs link",
    },
    argTypes: {
        path: { options: ["/", "/sidebar", "/bulk-editor"], control: { type: "select" } },
    },
    play: async ({ canvasElement, args }) => {
        const docsLink = within(canvasElement).getByRole("link");

        expect(docsLink).toHaveAttribute("href", appConfig.docs.baseUrl + args.path);
        expect(docsLink).toHaveAttribute("target", "_blank");
    },
};
