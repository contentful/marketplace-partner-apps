import { Menu } from "@contentful/f36-components";
import { FilterName, FilterProps, Filters, SearchBarProps } from "./SearchBar.types";
import { DoneIcon } from "@contentful/f36-icons";
import {
    CalendarFilter,
    CalendarFilterCondition,
    MultiSelectFilter,
    SearchBar as SearchBarComponent,
    SelectFilter,
} from "../../../../components";
import { useCallback, useEffect, useState } from "react";

export const SearchBar = ({
    isDisabled = false,
    search,
    onSearch,
    contentTypeOptions,
    userOptions,
    onFilterChange,
}: SearchBarProps) => {
    const [contentTypes, setContentTypes] = useState<Set<string>>(new Set());
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
    const [updatedAtCondition, setUpdatedAtCondition] = useState<CalendarFilterCondition>("is");
    const [createdAt, setCreatedAt] = useState<Date | null>(null);
    const [createdAtCondition, setCreatedAtCondition] = useState<CalendarFilterCondition>("is");
    const [publishedAt, setPublishedAt] = useState<Date | null>(null);
    const [publishedAtCondition, setPublishedAtCondition] = useState<CalendarFilterCondition>("is");
    const [firstPublishedAt, setFirstPublishedAt] = useState<Date | null>(null);
    const [firstPublishedAtCondition, setFirstPublishedAtCondition] = useState<CalendarFilterCondition>("is");
    const [updatedBy, setUpdatedBy] = useState<string>("");
    const [createdBy, setCreatedBy] = useState<string>("");
    const [publishedBy, setPublishedBy] = useState<string>("");

    const [activeFilters, setActiveFilters] = useState<Set<FilterName>>(new Set());

    // TODO:
    // const [hasChanges, setHasChanges, toggleHasChanges] = useState<"yes" | "no">("yes");

    const isActive = (filterName: FilterName) => activeFilters.has(filterName);

    const toggleFilter = (filterName: FilterName) => () => {
        setActiveFilters((prev) => {
            const next = new Set(prev);
            if (next.has(filterName)) {
                next.delete(filterName);
            } else {
                next.add(filterName);
            }
            return next;
        });
    };

    const filterProps: FilterProps = {
        contentTypes: {
            type: "multiSelect",
            toggle: toggleFilter("contentTypes"),
            props: {
                name: "Content type",
                selected: contentTypes,
                options: contentTypeOptions,
                onSelect: setContentTypes,
            },
        },
        updatedAt: {
            type: "calendar",
            toggle: toggleFilter("updatedAt"),
            props: {
                name: "Updated at",
                date: updatedAt,
                onDate: setUpdatedAt,
                condition: updatedAtCondition,
                onCondition: setUpdatedAtCondition,
            },
        },
        createdAt: {
            type: "calendar",
            toggle: toggleFilter("createdAt"),
            props: {
                name: "Created at",
                date: createdAt,
                onDate: setCreatedAt,
                condition: createdAtCondition,
                onCondition: setCreatedAtCondition,
            },
        },
        publishedAt: {
            type: "calendar",
            toggle: toggleFilter("publishedAt"),
            props: {
                name: "Published at",
                date: publishedAt,
                onDate: setPublishedAt,
                condition: publishedAtCondition,
                onCondition: setPublishedAtCondition,
            },
        },
        firstPublishedAt: {
            type: "calendar",
            toggle: toggleFilter("firstPublishedAt"),
            props: {
                name: "First published at",
                date: firstPublishedAt,
                onDate: setFirstPublishedAt,
                condition: firstPublishedAtCondition,
                onCondition: setFirstPublishedAtCondition,
            },
        },
        updatedBy: {
            type: "select",
            toggle: toggleFilter("updatedBy"),
            props: {
                name: "Updated by",
                selected: updatedBy,
                options: { "": "Any", ...userOptions },
                onSelect: setUpdatedBy,
            },
        },
        createdBy: {
            type: "select",
            toggle: toggleFilter("createdBy"),
            props: {
                name: "Created by",
                selected: createdBy,
                options: { "": "Any", ...userOptions },
                onSelect: setCreatedBy,
            },
        },
        publishedBy: {
            type: "select",
            toggle: toggleFilter("publishedBy"),
            props: {
                name: "Published by",
                selected: publishedBy,
                options: { "": "Any", ...userOptions },
                onSelect: setPublishedBy,
            },
        },
    };

    const filters = Array.from(activeFilters).map((filterName) => {
        const filter = filterProps[filterName];
        if (filter.type === "multiSelect") return <MultiSelectFilter {...filter.props} key={filterName} />;
        if (filter.type === "calendar") return <CalendarFilter {...filter.props} key={filterName} />;
        return <SelectFilter {...filter.props} key={filterName} />;
    });

    const filterMenuItems = Object.entries(filterProps).map(([filterName, { props, toggle }]) => (
        <Menu.Item
            key={filterName}
            icon={isActive(filterName as FilterName) ? <DoneIcon /> : undefined}
            onClick={toggle}
        >
            {props.name}
        </Menu.Item>
    ));

    useEffect(() => {
        onFilterChange(
            Array.from(activeFilters).reduce((acc: Filters, filterName) => {
                const { type, props } = filterProps[filterName as FilterName];
                if (type === "multiSelect" || type === "select") {
                    return {
                        ...acc,
                        [filterName as FilterName]: props.selected,
                    };
                }
                return {
                    ...acc,
                    [filterName as FilterName]: { date: props.date, condition: props.condition },
                };
            }, {}),
        );
    }, [
        activeFilters,
        ...Object.values(filterProps)
            .map(({ type, props }) => {
                if (type === "multiSelect" || type === "select") {
                    return props.selected;
                }
                return [props.date, props.condition];
            })
            .flat(),
    ]);

    const handleBackSpace = useCallback(() => {
        const lastFilterName = Array.from(activeFilters).pop();
        if (lastFilterName) {
            setActiveFilters((prev) => {
                const next = new Set(prev);
                next.delete(lastFilterName);
                return next;
            });
        }
    }, [activeFilters]);

    return (
        <SearchBarComponent
            search={search}
            onSearch={onSearch}
            filters={filters}
            filterMenuItems={filterMenuItems}
            isDisabled={isDisabled}
            onBackSpace={handleBackSpace}
        />
    );
};
