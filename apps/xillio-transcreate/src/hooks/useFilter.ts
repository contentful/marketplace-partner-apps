import { useCallback, useState } from "react";

export const useFilter = <FilterValue>(
    defaultFilter: FilterValue,
): [FilterValue | undefined, (filter: FilterValue) => void, () => void] => {
    const [filter, setFilter] = useState<FilterValue>();

    const toggleFilter = useCallback(() => {
        setFilter(filter === undefined ? defaultFilter : undefined);
    }, [filter, defaultFilter]);

    return [filter, setFilter, toggleFilter];
};
