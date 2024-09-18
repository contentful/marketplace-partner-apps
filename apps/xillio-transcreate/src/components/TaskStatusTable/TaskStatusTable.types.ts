import { TableCellSorting } from "@contentful/f36-components";
import { TaskStatus } from "..";

export type Task = {
    status: TaskStatus;
    targetLanguage: string;
    displayName: string;
    dueDate?: string;
};

export type TaskStatusTableSorting = {
    column: "locale" | "status" | "dueDate";
    direction: TableCellSorting;
};

export type TaskStatusTableProps = {
    tasks: Task[];
    isLoading?: boolean;
    selected?: Set<string>;
    onSelect?: (targetLanguages: Set<string>) => void;
    isSelectable?: (task: Task) => boolean;
    sorting?: TaskStatusTableSorting;
    onSort?: (sorting: TaskStatusTableSorting) => void;
};
