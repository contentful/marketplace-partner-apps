import { PageAppSDK } from "@contentful/app-sdk";
import {
    Button,
    Checkbox,
    Flex,
    MissingContent,
    Pagination,
    Paragraph,
    RelativeDateTime,
    Table,
    TableCellSorting,
} from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { EntryProps, QueryOptions } from "contentful-management";
import { useCallback, useMemo, useState } from "react";
import { AppInstallationParameters } from "../ConfigScreen";
import tokens from "@contentful/f36-tokens";
import { useApi, useById, useCollection, useDialog, useFetch, useInterval } from "../../hooks";
import { SelectOption, TableBodySkeleton, Task, TaskStatus } from "../../components";
import { TranslationJobFormData, UpdateTranslationFormData } from "../Dialog";
import { appConfig } from "../../appConfig";
import { CalendarFilterValue, Filters, SearchBar } from "./SearchBar";
import { EntryStatusBadge } from "./EntryStatusBadge";
import { Avatar } from "./Avatar";
import { TranslationDto, TranslationUpdateDto } from "@contentful-lochub/shared";

type Sorting = {
    column: string;
    direction: TableCellSorting;
};

type CalendarFilterName = "updatedAt" | "createdAt" | "publishedAt" | "firstPublishedAt";

const makeCalendarFilterQuery = (name: CalendarFilterName, { date, condition }: CalendarFilterValue) => {
    if (!date) return;
    const today = date.toISOString();
    const tomorrow = new Date(date.getTime() + 86399999).toISOString();

    switch (condition) {
        case "is":
            return {
                [`sys.${name}[gte]`]: today,
                [`sys.${name}[lte]`]: tomorrow,
            };
        case "is greater than":
            return {
                [`sys.${name}[gt]`]: tomorrow,
            };
        case "is greater than or equal to":
            return {
                [`sys.${name}[gte]`]: today,
            };
        case "is less than":
            return {
                [`sys.${name}[lt]`]: today,
            };
        case "is less than or equal to":
            return {
                [`sys.${name}[lte]`]: tomorrow,
            };
        default:
            return {};
    }
};

export const Page = () => {
    const sdk = useSDK<PageAppSDK<AppInstallationParameters>>();
    const { token, backendUrl } = sdk.parameters.installation;
    const api = useApi(backendUrl);
    const { open } = useDialog();

    // initial state
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const initialSorting = {
        column: "sys.updatedAt",
        direction: TableCellSorting.Descending,
    };
    const [sorting, setSorting] = useState<Sorting>(initialSorting);
    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [filters, setFilters] = useState<Filters>({});
    const [search, setSearch] = useState("");

    // fetch content types
    const fetchContentTypes = useCallback(() => sdk.cma.contentType.getMany({}), [sdk]);
    const { items: contentTypes } = useCollection(fetchContentTypes);
    const contentTypesById = useById(contentTypes, (contentType) => contentType.sys.id);

    // fetch users
    const fetchUsers = useCallback(() => sdk.cma.user.getManyForSpace({}), [sdk]);
    const { items: users } = useCollection(fetchUsers);
    const usersById = useById(users, (user) => user.sys.id);

    // fetch entries
    const fetchEntries = useCallback(() => {
        const order = `${sorting.direction === TableCellSorting.Descending ? "-" : ""}${sorting.column}`;
        let query: QueryOptions = {
            skip: page * itemsPerPage,
            limit: itemsPerPage,
            query: search || undefined,
            order,
            "sys.archivedAt[exists]": false,
        };
        const {
            contentTypes,
            updatedAt,
            createdAt,
            publishedAt,
            firstPublishedAt,
            updatedBy,
            createdBy,
            publishedBy,
        } = filters;
        if (contentTypes) {
            if (contentTypes.size === 1) query["content_type"] = Array.from(contentTypes)[0];
            if (contentTypes.size > 1)
                query["sys.contentType.sys.id[in]"] = Array.from(contentTypes).join(",");
        }
        if (updatedAt) query = { ...query, ...makeCalendarFilterQuery("updatedAt", updatedAt) };
        if (createdAt) query = { ...query, ...makeCalendarFilterQuery("createdAt", createdAt) };
        if (publishedAt) query = { ...query, ...makeCalendarFilterQuery("publishedAt", publishedAt) };
        if (firstPublishedAt)
            query = { ...query, ...makeCalendarFilterQuery("firstPublishedAt", firstPublishedAt) };
        if (updatedBy) query["sys.updatedBy.sys.id"] = updatedBy;
        if (createdBy) query["sys.createdBy.sys.id"] = createdBy;
        if (publishedBy) query["sys.publishedBy.sys.id"] = publishedBy;

        return sdk.cma.entry.getMany({ query }).finally(() => setSelected(new Set()));
    }, [sdk, page, itemsPerPage, search, filters, sorting]);
    const { items: entries, total: totalEntries } = useCollection(fetchEntries);
    const entryIds = useMemo(() => entries?.map((entry) => entry.sys.id), [entries]);

    // fetch LocHub project
    const fetchLocHubProjects = useCallback(() => api.projects.read({ generatedToken: token }), [token]);
    const [locHubProjects] = useFetch(fetchLocHubProjects);
    const projectOptions = useMemo<SelectOption[] | undefined>(
        () => locHubProjects?.map((project) => ({ label: project.name, value: project.id })),
        [locHubProjects],
    );

    // fetch LocHub jobs
    const fetchLocHubJobs = useCallback(async () => {
        if (!entryIds) return;
        return api.translations.read({
            generatedToken: token,
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment,
            entryIds,
        });
    }, [entryIds]);
    const [locHubJobs, refreshLocHubJobs, _setLocHubJobs] = useFetch(fetchLocHubJobs);
    const locHubJobsByEntryId = useById(locHubJobs, (job) => job.entryId);

    // tasks (inluding "not-translated") by entry id for all available entries
    const tasksByEntryId = useMemo(() => {
        if (!entryIds || !locHubJobsByEntryId) return;
        const _tasksByEntryId: Record<string, (Task & { requestedAt?: string })[]> = {};
        for (const entryId of entryIds) {
            const job = locHubJobsByEntryId[entryId];
            const tasks = sdk.locales.available.reduce((acc: Task[], locale) => {
                if (locale === sdk.locales.default) return acc;
                const lochubTask = job?.tasks.find((task) => task.targetLanguage === locale);
                let task: Task;
                if (lochubTask) task = { ...lochubTask, displayName: sdk.locales.names[locale] };
                else
                    task = {
                        status: "not-translated",
                        targetLanguage: locale,
                        displayName: sdk.locales.names[locale],
                    };
                return [...acc, task];
            }, []);
            _tasksByEntryId[entryId] = tasks;
        }
        return _tasksByEntryId;
    }, [entryIds, locHubJobsByEntryId]);

    // refresh LocHub jobs every interval
    const [refreshInterval, setRefreshInterval] = useState(5000);
    useInterval(refreshLocHubJobs, refreshInterval);

    // increase refresh interval to once every second for 5 seconds
    const [refreshTimerId, setRefreshTimerId] = useState<NodeJS.Timeout | null>(null);
    const increaseRefreshInterval = useCallback(() => {
        setRefreshInterval(1000);
        if (refreshTimerId) clearTimeout(refreshTimerId);
        const timerId = setTimeout(() => {
            setRefreshInterval(5000);
            setRefreshTimerId(null);
        }, 5000);
        setRefreshTimerId(timerId);
    }, [refreshTimerId]);

    const handleViewPerPageChange = (items: number) => {
        // Reset page to match item being shown on new View per page
        setPage(Math.floor((itemsPerPage * page + 1) / items));
        setItemsPerPage(items);
    };

    const handleSort = (column: string) => {
        const direction =
            sorting.column === column
                ? sorting.direction === TableCellSorting.Ascending
                    ? TableCellSorting.Descending
                    : TableCellSorting.Ascending
                : TableCellSorting.Descending;

        setSorting({ column, direction });
    };

    const handleSelect = (id: string) => {
        if (selected.has(id)) {
            const newSet = new Set(selected);
            newSet.delete(id);
            setSelected(newSet);
        } else {
            setSelected(new Set(selected).add(id));
        }
    };

    const handleSelectAll = () => {
        if (!entries) return;
        if (selected.size === entries.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(entries.map((entry) => entry.sys.id)));
        }
    };

    async function sendAction<T>({
        name,
        confirm,
        send,
    }: {
        name: string;
        confirm: () => Promise<T | undefined>;
        send: (data: T) => Promise<TranslationDto[]>;
    }) {
        const data = await confirm();
        if (!data) return;
        try {
            const jobs = await send(data);
            setSelected(new Set());
            if (jobs.length) {
                // merge new jobs with the existing lochub jobs
                if (!locHubJobs) {
                    _setLocHubJobs(jobs);
                } else {
                    const newJobs = [...locHubJobs];
                    for (const jobToAdd of jobs) {
                        const existingJob = newJobs.find((job) => job.entryId === jobToAdd.entryId);
                        if (existingJob) {
                            // merge tasks, new tasks go to front of array, so it's sorted by requestedAt
                            existingJob.tasks = [...jobToAdd.tasks, ...existingJob.tasks];
                        } else {
                            newJobs.push(jobToAdd);
                        }
                    }
                    _setLocHubJobs(newJobs);
                }

                sdk.notifier.success(
                    `Successfully sent the bulk ${name} action to your ${appConfig.name} account.`,
                );
            } else {
                sdk.notifier.warning(
                    `Could not apply the bulk ${name} action to any of the selected entries.`,
                );
            }
        } catch (error) {
            sdk.notifier.error(
                `Failed to send the bulk ${name} action to your ${appConfig.name} account. Please check the app configuration.`,
            );
        }
    }

    const selectedToEntries = () =>
        [...selected].flatMap((entryId) =>
            sdk.locales.available.reduce((acc: TranslationUpdateDto["entries"], locale) => {
                if (locale === sdk.locales.default) return acc;
                return [
                    ...acc,
                    {
                        entryId,
                        targetLanguage: locale,
                    },
                ];
            }, []),
        );

    const handleTranslate = async () => {
        if (!projectOptions) return;
        const confirm = (): Promise<TranslationJobFormData | undefined> =>
            open({
                type: "translate",
                projectOptions,
            });
        const send = (data: TranslationJobFormData) =>
            api.translations
                .create(
                    {
                        generatedToken: token,
                        recursive: data.sendRecursively,
                        dueDate: data.dueDate.toISOString(),
                        sourceLanguage: sdk.locales.default,
                        projectId: data.projectName,
                        jobName: data.translationJobName,
                        jobDescription: data.description,
                        jobSubmitter: data.submitter,
                        spaceId: sdk.ids.space,
                        environmentId: sdk.ids.environment,
                        entries: [...selected].flatMap((entryId) =>
                            data.locales.map((locale) => ({
                                entryId,
                                targetLanguage: locale,
                            })),
                        ),
                    },
                    tasksByEntryId,
                )
                .then((jobs) => {
                    // if data was sent recursively, temporarily increase jobs refresh interval
                    if (data.sendRecursively) increaseRefreshInterval();
                    return jobs;
                });
        await sendAction({ name: "translate", confirm, send });
    };

    const handleUpdate = async () => {
        const confirm = (): Promise<UpdateTranslationFormData | undefined> =>
            open({
                type: "update",
                dueDate: new Date().toISOString(), // TODO: current due date?
            });
        const send = (data: UpdateTranslationFormData) =>
            api.translations.update(
                {
                    generatedToken: token,
                    spaceId: sdk.ids.space,
                    environmentId: sdk.ids.environment,
                    entries: selectedToEntries(),
                    dueDate: data.dueDate.toISOString(),
                },
                tasksByEntryId,
            );
        await sendAction({ name: "update", confirm, send });
    };

    const handlePause = async () => {
        const confirm = (): Promise<boolean | undefined> =>
            open({
                type: "confirm",
                title: "Pause",
                message:
                    "Are you sure that you want to pause all confirmed and in progress translations for all selected entries?",
            });
        const send = () =>
            api.translations.pause(
                {
                    generatedToken: token,
                    spaceId: sdk.ids.space,
                    environmentId: sdk.ids.environment,
                    entries: selectedToEntries(),
                },
                tasksByEntryId,
            );
        await sendAction({ name: "pause", confirm, send });
    };

    const handleResume = async () => {
        const confirm = (): Promise<boolean | undefined> =>
            open({
                type: "confirm",
                title: "Resume",
                message:
                    "Are you sure that you want to resume all paused translations for all selected entries?",
            });
        const send = () =>
            api.translations.resume(
                {
                    generatedToken: token,
                    spaceId: sdk.ids.space,
                    environmentId: sdk.ids.environment,
                    entries: selectedToEntries(),
                },
                tasksByEntryId,
            );
        await sendAction({ name: "resume", confirm, send });
    };

    const handleCancel = async () => {
        const confirm = (): Promise<boolean | undefined> =>
            open({
                type: "confirm",
                title: "Cancel",
                message:
                    "Are you sure that you want to cancel all confirmed or paused translations for all selected entries?",
            });
        const send = () =>
            api.translations.cancel(
                {
                    generatedToken: token,
                    spaceId: sdk.ids.space,
                    environmentId: sdk.ids.environment,
                    entries: selectedToEntries(),
                },
                tasksByEntryId,
            );
        await sendAction({ name: "cancel", confirm, send });
    };

    const hasValidStatus = (validStatuses: TaskStatus[]) => {
        if (!tasksByEntryId) return false;
        return [...selected].some(
            (entryId) => tasksByEntryId[entryId]?.some((task) => validStatuses.includes(task.status)),
        );
    };

    const canTranslate = hasValidStatus([
        "cancelled",
        "rejected",
        "completed",
        "completed-with-warnings",
        "failed",
        "not-translated",
    ]);
    const canUpdate = hasValidStatus(["pending", "confirmed", "in-progress", "paused"]);
    const canPause = hasValidStatus(["confirmed", "in-progress"]);
    const canResume = hasValidStatus(["paused"]);
    const canCancel = hasValidStatus(["confirmed", "paused"]);

    const EntryName = ({ entry }: { entry: EntryProps }) => {
        if (!contentTypesById) return <MissingContent />; // TODO: skeleton instead?
        const contentType = contentTypesById[entry.sys.contentType.sys.id];
        if (!contentType) return <MissingContent label="Unknown content type" />;
        if (!contentType.displayField || !entry.fields[contentType.displayField]) return "Untitled";
        else return entry.fields[contentType.displayField][sdk.locales.default];
    };

    const EntryAvatar = ({ entry }: { entry: EntryProps }) => {
        if (!entry.sys.updatedBy) return <MissingContent />; // TODO: skeleton instead?
        if (entry.sys.updatedBy.sys.id === sdk.ids.app) {
            return appConfig.name;
        }
        if (!usersById) return <MissingContent label="Unknown user" />;
        const user = usersById[entry.sys.updatedBy.sys.id];
        if (!user) return <MissingContent label="Unknown user" />;
        const { firstName, lastName, avatarUrl } = usersById[entry.sys.updatedBy.sys.id];
        return <Avatar name={`${firstName} ${lastName}`} src={avatarUrl} />;
    };

    const EntryContentType = ({ entry }: { entry: EntryProps }) => {
        if (!contentTypesById) return <MissingContent />; // TODO: skeleton instead?
        const contentType = contentTypesById[entry.sys.contentType.sys.id];
        if (!contentType) return <MissingContent label="Unknown content type" />;
        return contentType.name;
    };

    const EntryStatus = ({ entry }: { entry: EntryProps }) => {
        if (!tasksByEntryId) return <MissingContent />; // TODO: skeleton instead?
        const tasks = tasksByEntryId[entry.sys.id];
        return <EntryStatusBadge tasks={tasks} />;
    };

    return (
        <Flex flexDirection="column" padding="spacingS" gap="spacingS">
            <SearchBar
                search={search}
                onSearch={setSearch}
                contentTypeOptions={Object.values(contentTypesById ?? {}).reduce(
                    (acc, contentType) => ({ ...acc, [contentType.sys.id]: contentType.name }),
                    {},
                )}
                userOptions={Object.values(usersById ?? {}).reduce(
                    (acc, user) => ({ ...acc, [user.sys.id]: `${user.firstName} ${user.lastName}` }),
                    sdk.ids.app ? { [sdk.ids.app]: appConfig.name } : {},
                )}
                onFilterChange={setFilters}
            />
            <Table verticalAlign="middle">
                <Table.Head>
                    <Table.Row>
                        <Table.Cell>
                            <Checkbox
                                isDisabled={!entries}
                                isChecked={selected.size > 0 && selected.size === entries?.length}
                                onChange={handleSelectAll}
                            />
                        </Table.Cell>
                        <Table.Cell>Name</Table.Cell>
                        <Table.Cell>Content type</Table.Cell>
                        <Table.Cell
                            isSortable
                            onClick={() => handleSort("sys.updatedAt")}
                            sortDirection={sorting.column === "sys.updatedAt" ? sorting.direction : undefined}
                        >
                            Updated
                        </Table.Cell>
                        <Table.Cell>Last updated by</Table.Cell>
                        <Table.Cell>Status</Table.Cell>
                    </Table.Row>
                    {selected.size > 0 && (
                        <Table.Row>
                            <Table.Cell colSpan={6}>
                                <Paragraph style={{ color: tokens.gray500 }} marginBottom="spacingXs">
                                    {selected.size} {selected.size === 1 ? "entry" : "entries"} selected:
                                </Paragraph>
                                <Flex gap="spacingXs">
                                    <Button
                                        size="small"
                                        variant="positive"
                                        onClick={handleTranslate}
                                        isDisabled={!canTranslate}
                                    >
                                        Translate
                                    </Button>
                                    <Button size="small" onClick={handleUpdate} isDisabled={!canUpdate}>
                                        Update
                                    </Button>
                                    <Button size="small" onClick={handlePause} isDisabled={!canPause}>
                                        Pause
                                    </Button>
                                    <Button size="small" onClick={handleResume} isDisabled={!canResume}>
                                        Resume
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="negative"
                                        onClick={handleCancel}
                                        isDisabled={!canCancel}
                                    >
                                        Cancel
                                    </Button>
                                </Flex>
                            </Table.Cell>
                        </Table.Row>
                    )}
                </Table.Head>
                <Table.Body>
                    {!entries ? (
                        <TableBodySkeleton hasCheckbox rows={10} columns={5} />
                    ) : (
                        entries
                            ?.filter((entry) => {
                                // TODO: move this logic in hook? keep fetching until page is full or no entries left
                                // that satisfy the custom filter
                                const filter = filters["hasChanges"];
                                if (filter === undefined || !tasksByEntryId) return true;
                                const tasks = tasksByEntryId[entry.sys.id];
                                const hasChanges = tasks.some(
                                    (task) =>
                                        task.requestedAt &&
                                        new Date(task.requestedAt) < new Date(entry.sys.updatedAt),
                                );
                                return (filter === "no" && !hasChanges) || (filter === "yes" && hasChanges);
                            })
                            .map((entry) => (
                                <Table.Row
                                    key={entry.sys.id}
                                    onClick={() => sdk.navigator.openEntry(entry.sys.id)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <Table.Cell>
                                        <Checkbox
                                            isDisabled={!entries}
                                            isChecked={selected.has(entry.sys.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={() => handleSelect(entry.sys.id)}
                                        />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <EntryName entry={entry} />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <EntryContentType entry={entry} />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <RelativeDateTime
                                            isRelativeToCurrentWeek
                                            date={entry.sys.updatedAt}
                                        />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <EntryAvatar entry={entry} />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <EntryStatus entry={entry} />
                                    </Table.Cell>
                                </Table.Row>
                            ))
                    )}
                </Table.Body>
            </Table>
            <Pagination
                activePage={page}
                onPageChange={setPage}
                totalItems={totalEntries}
                showViewPerPage
                viewPerPageOptions={[20, 50, 100]}
                itemsPerPage={itemsPerPage}
                onViewPerPageChange={handleViewPerPageChange}
            />
        </Flex>
    );
};
