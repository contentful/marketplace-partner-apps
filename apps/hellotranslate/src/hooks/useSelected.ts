import { useCallback, useState } from "react";

export const useSelected = <T>(items?: T[]) => {
    const [selected, setSelected] = useState<Set<T>>(new Set());

    const toggleSelected = useCallback(
        (item: T) => {
            if (selected.has(item)) {
                const newSet = new Set(selected);
                newSet.delete(item);
                setSelected(newSet);
            } else {
                setSelected(new Set(selected).add(item));
            }
        },
        [selected],
    );

    const toggleAllSelected = useCallback(() => {
        if (!items) return;
        if (selected.size === items.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(items));
        }
    }, [selected, items]);

    return {
        selected,
        setSelected,
        toggleSelected,
        toggleAllSelected,
    };
};
