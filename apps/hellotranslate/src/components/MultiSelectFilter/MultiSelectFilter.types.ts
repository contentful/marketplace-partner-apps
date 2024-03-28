export type MultiSelectFilterProps<MultiSelectFilterValue extends string> = {
    name: string;
    options: Record<MultiSelectFilterValue, string>;
    selected: Set<MultiSelectFilterValue>;
    onSelect: (selected: Set<MultiSelectFilterValue>) => void;
    isDisabled?: boolean;
};

export type MultiSelectFilterSearchBarProps = {
    search: string;
    onSearch: (search: string) => void;
};
