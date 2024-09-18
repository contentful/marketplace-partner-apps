import {
    CalendarFilterProps as _CalendarFilterProps,
    MultiSelectFilterProps as _MultiSelectFilterProps,
    SelectFilterProps as _SelectFilterProps,
} from "../../../../components";

export type CalendarFilterValue = Pick<_CalendarFilterProps, "date" | "condition">;

export type Filters = {
    contentTypes?: Set<string>;
    updatedAt?: CalendarFilterValue;
    createdAt?: CalendarFilterValue;
    publishedAt?: CalendarFilterValue;
    firstPublishedAt?: CalendarFilterValue;
    updatedBy?: string;
    createdBy?: string;
    publishedBy?: string;
    // hasChanges?: "yes" | "no";
};

export type FilterName = keyof Filters;

type BaseFilterProps = {
    toggle: () => void;
};

export type MultiSelectFilterProps = BaseFilterProps & {
    type: "multiSelect";
    props: _MultiSelectFilterProps<string>;
};

export type CalendarFilterProps = BaseFilterProps & {
    type: "calendar";
    props: _CalendarFilterProps;
};

export type SelectFilterProps = BaseFilterProps & {
    type: "select";
    props: _SelectFilterProps<string>;
};

export type FilterProps = Record<
    FilterName,
    MultiSelectFilterProps | CalendarFilterProps | SelectFilterProps
>;

export type SearchBarProps = {
    contentTypeOptions: Record<string, string>;
    userOptions: Record<string, string>;
    isDisabled?: boolean;
    search: string;
    onSearch: (search: string) => void;
    onFilterChange: (filters: Filters) => void;
};
