import {
    TranslationDto,
    TranslationRequestDto,
    TranslationStatusDto,
    TranslationUpdateDto,
    TranslationTransitionDto,
} from "@contentful-lochub/shared";
import { Task, TaskStatus } from "../components";
import { CollectionController } from "./CollectionController";

export class TranslationsController extends CollectionController {
    async read(body: TranslationStatusDto) {
        return this.execute<TranslationDto[]>(`/translate/status`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    private validStatus(tasksByEntryId: Record<string, Task[]>, validStatuses: TaskStatus[]) {
        return ({ entryId, targetLanguage }: { entryId: string; targetLanguage: string }) => {
            const tasks = tasksByEntryId[entryId];
            if (!tasks) return false; // entry not found, should not be the case
            const task = tasks.find((task) => task.targetLanguage === targetLanguage);
            if (!task) return false; // no task, should not be the case
            return validStatuses.includes(task.status);
        };
    }

    async create(body: TranslationRequestDto, tasksByEntryId?: Record<string, Task[]>) {
        const entries = tasksByEntryId
            ? body.entries.filter(
                  this.validStatus(tasksByEntryId, [
                      "cancelled",
                      "rejected",
                      "completed",
                      "completed-with-warnings",
                      "failed",
                      "not-translated",
                  ]),
              )
            : body.entries;
        if (!entries.length) return Promise.resolve([]);
        return this.execute<TranslationDto[]>(`/translate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...body, entries }),
        });
    }

    async update(body: TranslationUpdateDto, tasksByEntryId?: Record<string, Task[]>) {
        const entries = tasksByEntryId
            ? body.entries.filter(
                  this.validStatus(tasksByEntryId, ["pending", "confirmed", "in-progress", "paused"]),
              )
            : body.entries;
        if (!entries.length) return Promise.resolve([]);
        return this.execute<TranslationDto[]>(`/translate`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...body, entries }),
        });
    }

    async pause(body: TranslationTransitionDto, tasksByEntryId?: Record<string, Task[]>) {
        const entries = tasksByEntryId
            ? body.entries.filter(this.validStatus(tasksByEntryId, ["confirmed", "in-progress"]))
            : body.entries;
        if (!entries.length) return Promise.resolve([]);
        return this.execute<TranslationDto[]>(`/translate/pause`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    async resume(body: TranslationTransitionDto, tasksByEntryId?: Record<string, Task[]>) {
        const entries = tasksByEntryId
            ? body.entries.filter(this.validStatus(tasksByEntryId, ["paused"]))
            : body.entries;
        if (!entries.length) return Promise.resolve([]);
        return this.execute<TranslationDto[]>(`/translate/resume`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    async cancel(body: TranslationTransitionDto, tasksByEntryId?: Record<string, Task[]>) {
        const entries = tasksByEntryId
            ? body.entries.filter(this.validStatus(tasksByEntryId, ["confirmed", "paused"]))
            : body.entries;
        if (!entries.length) return Promise.resolve([]);
        return this.execute<TranslationDto[]>(`/translate/cancel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }
}
