import type { Meta, StoryObj } from "@storybook/react";

import { ConnectModal as ConnectModalComponent, ConnectModalProps } from "./ConnectModal";

export default {
    title: "Locations/ConfigScreen/ConnectModal",
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
        onConnect: {
            table: {
                disable: true,
            },
        },
    },
} satisfies Meta<typeof ConnectModalComponent>;

type Story = StoryObj<ConnectModalProps>;

export const Success: Story = {
    args: {
        isShown: true,
        onConnect: () => Promise.resolve(),
        onClose: () => console.log("close"),
    },
};

export const Fail: Story = {
    args: {
        isShown: true,
        onConnect: () => Promise.reject(),
        onClose: () => console.log("close"),
    },
};
