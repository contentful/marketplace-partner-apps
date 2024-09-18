import type { Meta, StoryObj } from "@storybook/react";

import { ConfigScreenComponent, ConfigScreenComponentProps, AppInstallationParameters } from "./ConfigScreen";
import { useForm } from "react-hook-form";

export default {
    title: "Locations/ConfigScreen/ConfigScreen",
    component: ConfigScreenComponent,
    parameters: {
        layout: "fullscreen",
    },
    argTypes: {
        form: {
            table: {
                disable: true,
            },
        },
        projectOptions: {
            table: {
                disable: true,
            },
        },
    },
} satisfies Meta<typeof ConfigScreenComponent>;

type Story = StoryObj<ConfigScreenComponentProps>;

// TODO: update stories
export const Success: Story = {
    args: {
        onConnect: () => Promise.resolve(),
        connected: false,
        projectOptions: [
            {
                label: "Project 1",
                value: "Project 1",
            },
            {
                label: "Project 2",
                value: "Project 2",
            },
            {
                label: "Project 3",
                value: "Project 3",
            },
        ],
    },
    render: (args) => {
        const form = useForm<AppInstallationParameters>();

        return <ConfigScreenComponent {...args} form={form} />;
    },
};
