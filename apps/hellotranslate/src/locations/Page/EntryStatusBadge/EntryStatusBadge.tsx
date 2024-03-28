import { BadgeVariant, Popover, Badge } from "@contentful/f36-components";
import { useState, useMemo } from "react";
import { TaskStatusTable } from "../../../components";
import { EntryStatusBadgeProps } from "./EntryStatusBadge.types";

export const EntryStatusBadge = ({ tasks }: EntryStatusBadgeProps) => {
    const hasTasks = Boolean(tasks?.length);
    const [visible, setVisible] = useState(false);
    const { variant, label } = useMemo<{ label: string; variant: BadgeVariant }>(() => {
        if (tasks.some((task) => task.status === "not-translated"))
            return {
                label: "Not translated",
                variant: "secondary",
            };

        if (tasks.some((task) => ["pending", "confirmed", "in-progress", "paused"].includes(task.status)))
            return {
                label: "Translating",
                variant: "primary",
            };

        if (tasks.some((task) => ["failed", "rejected"].includes(task.status)))
            return {
                label: "Failed",
                variant: "negative",
            };

        if (tasks.some((task) => task.status === "cancelled"))
            return {
                label: "Cancelled",
                variant: "secondary",
            };

        if (tasks.some((task) => task.status === "completed-with-warnings"))
            return {
                label: "Warnings",
                variant: "warning",
            };

        return {
            label: "Translated",
            variant: "positive",
        };
    }, [tasks]);

    return (
        <Popover isOpen={hasTasks && visible} autoFocus={false}>
            <Popover.Trigger>
                <Badge
                    variant={variant}
                    onMouseOver={() => setVisible(true)}
                    onMouseOut={() => setVisible(false)}
                >
                    {label}
                </Badge>
            </Popover.Trigger>
            <Popover.Content>
                <TaskStatusTable tasks={tasks} />
            </Popover.Content>
        </Popover>
    );
};
