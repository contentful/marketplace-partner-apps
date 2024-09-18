import type { Meta, StoryObj } from "@storybook/react";
import { TaskStatusBadge as TaskStatusBadgeComponent, TaskStatusBadgeProps } from ".";

export default {
    title: "Components/Data Display/TaskStatusBadge",
    component: TaskStatusBadgeComponent,
    parameters: {
        controls: {
            include: ["status"],
        },
    },
} satisfies Meta<typeof TaskStatusBadgeComponent>;

type Story = StoryObj<TaskStatusBadgeProps>;

export const TaskStatusBadge: Story = {
    args: {
        status: "completed",
    },
    argTypes: {
        status: {
            options: [
                "pending",
                "confirmed",
                "in-progress",
                "paused",
                "cancelled",
                "completed",
                "completed-with-warnings",
                "failed",
                "rejected",
                "not-translated",
            ],
            control: { type: "select" },
        },
    },
};
