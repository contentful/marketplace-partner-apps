import { TableCellSorting } from "@contentful/f36-components";
import { ContentTypeProps, EntryProps, UserProps } from "contentful-management";
import { SelectOption, Task } from "../../../components";
import { TranslationJobFormData, UpdateTranslationFormData } from "../../Dialog";
import { Filters } from "./SearchBar";

export type Sorting = {
    column: string;
    direction: TableCellSorting;
};

export type CalendarFilterName = "updatedAt" | "createdAt" | "publishedAt" | "firstPublishedAt";

type TaskWithRequestedAt = Task & {
    requestedAt?: string | undefined;
};

export type BulkEditorComponentProps = {
    selected: Set<string>;
    onSelect: (selected: Set<string>) => void;
    sorting: Sorting;
    onSort: (sorting: Sorting) => void;
    page: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    onItemsPerPageChange: (itemsPerPage: number) => void;
    search: string;
    onSearch: (search: string) => void;
    onFilterChange: (filters: Filters) => void;
    appId: string | undefined;
    defaultLocale: string;
    contentTypesById: Record<string, ContentTypeProps> | undefined;
    usersById: Record<string, UserProps> | undefined;
    tasksByEntryId: Record<string, TaskWithRequestedAt[]> | undefined;
    projectOptions: SelectOption[] | undefined;
    entries: EntryProps[] | undefined;
    totalEntries: number | undefined;
    onTranslate: (data: TranslationJobFormData) => void;
    onUpdate: (data: UpdateTranslationFormData) => void;
    onPause: () => void;
    onResume: () => void;
    onCancel: () => void;
    onOpenEntry: (entryId: string) => void;
};
