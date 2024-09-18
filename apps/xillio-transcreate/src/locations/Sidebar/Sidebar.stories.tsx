import type { Meta, StoryObj } from "@storybook/react";

import { SidebarComponent, SidebarComponentProps } from "./Sidebar";

import { TranslationStatus } from "../../types";

export default {
    title: "Locations/Sidebar",
    component: SidebarComponent,
    parameters: {
        layout: "centered",
    },
    decorators: [
        (Story) => (
            <>
                <div style={{ width: "21.5rem", padding: "1rem", border: "1px solid black" }}>
                    <Story />
                </div>
            </>
        ),
    ],
} satisfies Meta<typeof SidebarComponent>;

type Story = StoryObj<SidebarComponentProps>;

const localeOptions = {
    nl: "Dutch",
    "en-US": "English (US)",
    "en-UK": "English (UK)",
    dk: "Danish",
    af: "Afrikaans",
    "zh-cn": "Chinese (China)",
};

const taskStatuses: TranslationStatus[] = [
    "failed",
    "in-progress",
    "pending",
    "confirmed",
    "paused",
    "cancelled",
    "completed",
    "completed-with-warnings",
    "rejected",
];

export const Sidebar: Story = {
    args: {
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
        tasks: Object.keys(localeOptions).map((targetLanguage, index) => ({
            status: taskStatuses[index],
            targetLanguage,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            displayName: "Test",
        })),
        isLoading: false,
        onTranslate: async (data) => console.log(data),
        onUpdate: async (data) => console.log(data),
        onCancel: async (data) => console.log(data),
        onPause: async (data) => console.log(data),
        onResume: async (data) => console.log(data),
    },
};
