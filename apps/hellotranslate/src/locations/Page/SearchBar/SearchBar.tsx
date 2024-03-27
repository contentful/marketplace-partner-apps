import { Menu } from "@contentful/f36-components";
import { SearchBarProps } from "./SearchBar.types";
import { DoneIcon } from "@contentful/f36-icons";
import { useFilter } from "../../../hooks";
import {
    CalendarFilter,
    CalendarFilterCondition,
    MultiSelectFilter,
    SearchBar as SearchBarComponent,
    SelectFilter,
} from "../../../components";
import { ReactNode, useEffect, useMemo, useState } from "react";

export const SearchBar = ({
    isDisabled = false,
    search,
    onSearch,
    contentTypeOptions,
    userOptions,
    onFilterChange,
}: SearchBarProps) => {
    const [contentTypes, setContentTypes, toggleContentTypes] = useFilter<Set<string>>(new Set());
    const [updatedAt, setUpdatedAt, toggleUpdatedAt] = useFilter<Date | null>(null);
    const [updatedAtCondition, setUpdatedAtCondition] = useState<CalendarFilterCondition>("is");
    const [createdAt, setCreatedAt, toggleCreatedAt] = useFilter<Date | null>(null);
    const [createdAtCondition, setCreatedAtCondition] = useState<CalendarFilterCondition>("is");
    const [publishedAt, setPublishedAt, togglePublishedAt] = useFilter<Date | null>(null);
    const [publishedAtCondition, setPublishedAtCondition] = useState<CalendarFilterCondition>("is");
    const [firstPublishedAt, setFirstPublishedAt, toggleFirstPublishedAt] = useFilter<Date | null>(null);
    const [firstPublishedAtCondition, setFirstPublishedAtCondition] = useState<CalendarFilterCondition>("is");
    const [updatedBy, setUpdatedBy, toggleUpdatedBy] = useFilter<string>("");
    const [createdBy, setCreatedBy, toggleCreatedBy] = useFilter<string>("");
    const [publishedBy, setPublishedBy, togglePublishedBy] = useFilter<string>("");

    // TODO:
    // const [hasChanges, setHasChanges, toggleHasChanges] = useFilter<"yes" | "no">("yes");

    const filterValues = [
        contentTypes,
        updatedAt,
        createdAt,
        publishedAt,
        firstPublishedAt,
        updatedBy,
        createdBy,
        publishedBy,
    ];

    const conditionValues = [
        updatedAtCondition,
        createdAtCondition,
        publishedAtCondition,
        firstPublishedAtCondition,
    ];

    const activeFilters = useMemo(() => {
        const _filters: ReactNode[] = [];

        if (contentTypes !== undefined) {
            _filters.push(
                <MultiSelectFilter
                    isDisabled={isDisabled}
                    name="Content type"
                    options={contentTypeOptions}
                    selected={contentTypes}
                    onSelect={setContentTypes}
                />,
            );
        }

        if (updatedAt !== undefined) {
            _filters.push(
                <CalendarFilter
                    isDisabled={isDisabled}
                    name="Updated at"
                    date={updatedAt}
                    onDate={setUpdatedAt}
                    condition={updatedAtCondition}
                    onCondition={setUpdatedAtCondition}
                />,
            );
        }

        if (createdAt !== undefined) {
            _filters.push(
                <CalendarFilter
                    isDisabled={isDisabled}
                    name="Created at"
                    date={createdAt}
                    onDate={setCreatedAt}
                    condition={createdAtCondition}
                    onCondition={setCreatedAtCondition}
                />,
            );
        }

        if (publishedAt !== undefined) {
            _filters.push(
                <CalendarFilter
                    isDisabled={isDisabled}
                    name="Published at"
                    date={publishedAt}
                    onDate={setPublishedAt}
                    condition={publishedAtCondition}
                    onCondition={setPublishedAtCondition}
                />,
            );
        }

        if (firstPublishedAt !== undefined) {
            _filters.push(
                <CalendarFilter
                    isDisabled={isDisabled}
                    name="First published at"
                    date={firstPublishedAt}
                    onDate={setFirstPublishedAt}
                    condition={firstPublishedAtCondition}
                    onCondition={setFirstPublishedAtCondition}
                />,
            );
        }

        if (updatedBy !== undefined) {
            _filters.push(
                <SelectFilter
                    isDisabled={isDisabled}
                    name="Updated by"
                    options={{ "": "Any", ...userOptions }}
                    selected={updatedBy}
                    onSelect={setUpdatedBy}
                />,
            );
        }

        if (createdBy !== undefined) {
            _filters.push(
                <SelectFilter
                    isDisabled={isDisabled}
                    name="Created by"
                    options={{ "": "Any", ...userOptions }}
                    selected={createdBy}
                    onSelect={setCreatedBy}
                />,
            );
        }

        if (publishedBy !== undefined) {
            _filters.push(
                <SelectFilter
                    isDisabled={isDisabled}
                    name="Published by"
                    options={{ "": "Any", ...userOptions }}
                    selected={publishedBy}
                    onSelect={setPublishedBy}
                />,
            );
        }

        return _filters;
    }, [...filterValues, ...conditionValues, isDisabled]);

    const filterMenuItems = useMemo(
        () => [
            <FilterMenuItem label="Content type" filter={contentTypes} toggleFilter={toggleContentTypes} />,
            <FilterMenuItem label="Updated at" filter={updatedAt} toggleFilter={toggleUpdatedAt} />,
            <FilterMenuItem label="Created at" filter={createdAt} toggleFilter={toggleCreatedAt} />,
            <FilterMenuItem label="Published at" filter={publishedAt} toggleFilter={togglePublishedAt} />,
            <FilterMenuItem
                label="First published at"
                filter={firstPublishedAt}
                toggleFilter={toggleFirstPublishedAt}
            />,
            <FilterMenuItem label="Updated by" filter={updatedBy} toggleFilter={toggleUpdatedBy} />,
            <FilterMenuItem label="Created by" filter={createdBy} toggleFilter={toggleCreatedBy} />,
            <FilterMenuItem label="Published by" filter={publishedBy} toggleFilter={togglePublishedBy} />,
        ],
        filterValues,
    );

    useEffect(() => {
        const calendarFilter = (date: Date | null | undefined, condition: CalendarFilterCondition) =>
            date === undefined ? undefined : { date, condition };
        onFilterChange({
            contentTypes,
            updatedAt: calendarFilter(updatedAt, updatedAtCondition),
            createdAt: calendarFilter(createdAt, createdAtCondition),
            publishedAt: calendarFilter(publishedAt, publishedAtCondition),
            firstPublishedAt: calendarFilter(firstPublishedAt, firstPublishedAtCondition),
            updatedBy,
            createdBy,
            publishedBy,
        });
    }, [...filterValues, ...conditionValues]);

    return (
        <SearchBarComponent
            search={search}
            onSearch={onSearch}
            filters={activeFilters}
            filterMenuItems={filterMenuItems}
            isDisabled={isDisabled}
        />
    );
};

type FilterMenuItemProps<FilterValue> = {
    label: string;
    filter: FilterValue;
    toggleFilter: () => void;
};

function FilterMenuItem<FilterValue>({ label, filter, toggleFilter }: FilterMenuItemProps<FilterValue>) {
    return (
        <Menu.Item icon={filter === undefined ? undefined : <DoneIcon />} onClick={toggleFilter}>
            {label}
        </Menu.Item>
    );
}
