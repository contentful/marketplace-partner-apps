import type { Meta, StoryObj } from "@storybook/react";
import { TaskStatusTable as TaskStatusTableComponent, TaskStatusTableProps } from ".";
import { formatDateAndTime } from "@contentful/f36-components";

import { userEvent, within, expect } from "@storybook/test";
import { capitalize } from "../../utils";

export default {
    title: "Components/Data Display/TaskStatusTable",
    component: TaskStatusTableComponent,
    parameters: {
        controls: {
            include: ["isLoading"],
        },
    },
} satisfies Meta<typeof TaskStatusTableComponent>;

type Story = StoryObj<TaskStatusTableProps>;

export const TaskStatusTable: Story = {
    args: {
        tasks: [
            { status: "pending", targetLanguage: "nl", displayName: "Dutch" },
            { status: "completed", targetLanguage: "de", displayName: "German" },
            { status: "failed", targetLanguage: "fr", displayName: "French" },
            {
                status: "paused",
                targetLanguage: "es",
                displayName: "Spanish",
                dueDate: new Date(2024, 6, 5).toISOString(),
            },
            {
                status: "in-progress",
                targetLanguage: "it",
                displayName: "Italian",
                dueDate: new Date(2024, 6, 1).toISOString(),
            },
        ],
        isLoading: false,
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        const expectSorting = (text: string[]) => {
            const [_, ...rows] = canvas.getAllByRole("row");
            text.forEach((displayName, index) => expect(rows[index]).toHaveTextContent(displayName));
        };

        const displayNames = args.tasks.map((task) => task.displayName).sort();

        expectSorting(displayNames);

        await userEvent.click(canvas.getByText("Locale"));

        expectSorting(displayNames.reverse());

        const statuses = args.tasks.map((task) => task.status.split("-").map(capitalize).join(" ")).sort();

        await userEvent.click(canvas.getByText("Status"));

        expectSorting(statuses);

        await userEvent.click(canvas.getByText("Status"));

        expectSorting(statuses.reverse());

        const dueDates = args.tasks
            .map((task) => (task.dueDate ? formatDateAndTime(task.dueDate, "day") : "—"))
            .sort((a, b) => {
                if (a === "—") return -1;
                if (b === "—") return 1;
                return new Date(a).getTime() - new Date(b).getTime();
            });

        console.log(dueDates);

        await userEvent.click(canvas.getByText("Due at"));

        expectSorting(dueDates);

        await userEvent.click(canvas.getByText("Due at"));

        expectSorting(dueDates.reverse());
    },
};
