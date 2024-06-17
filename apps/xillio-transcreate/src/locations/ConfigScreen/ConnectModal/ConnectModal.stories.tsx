import type { Meta, StoryObj } from "@storybook/react";

import { ConnectModal as ConnectModalComponent, ConnectModalProps } from "./ConnectModal";
import { GlobalStyles } from "@contentful/f36-components";

export default {
    title: "Locations/ConnectModal",
    component: ConnectModalComponent,
    parameters: {
        layout: "centered",
    },
    argTypes: {
        onClose: {
            table: {
                disable: true,
            },
        },
        connect: {
            table: {
                disable: true,
            },
        },
    },
    decorators: [
        (Story) => (
            <>
                <GlobalStyles />
                <Story />
            </>
        ),
    ],
} satisfies Meta<typeof ConnectModalComponent>;

type Story = StoryObj<ConnectModalProps>;

export const ConnectModalSuccess: Story = {
    args: {
        isShown: true,
        connect: () => Promise.resolve("api-token"),
        onClose: (token) => console.log(token),
    },
};

export const ConnectModalFail: Story = {
    args: {
        isShown: true,
        connect: () => Promise.reject(),
        onClose: (token) => console.log(token),
    },
};
