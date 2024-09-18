import { TranslationStatus } from "../../types";

export type TaskStatus = TranslationStatus | "not-translated";

export type TaskStatusBadgeProps = {
    status: TaskStatus;
};
