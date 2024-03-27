import { CalendarFilterProps } from "../../../components";

export type CalendarFilterValue = Pick<CalendarFilterProps, "date" | "condition">;

export type Filters = {
    contentTypes?: Set<string>;
    updatedAt?: CalendarFilterValue;
    createdAt?: CalendarFilterValue;
    publishedAt?: CalendarFilterValue;
    firstPublishedAt?: CalendarFilterValue;
    updatedBy?: string;
    createdBy?: string;
    publishedBy?: string;
    hasChanges?: "yes" | "no";
};

export type SearchBarProps = {
    contentTypeOptions: Record<string, string>;
    userOptions: Record<string, string>;
    isDisabled?: boolean;
    search: string;
    onSearch: (search: string) => void;
    onFilterChange: (filters: Filters) => void;
};
