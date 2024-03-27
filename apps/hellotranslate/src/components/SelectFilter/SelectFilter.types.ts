export type SelectFilterProps<SelectFilterValue extends string> = {
    name: string;
    options: Record<SelectFilterValue, string>;
    selected: SelectFilterValue;
    onSelect: (selected: SelectFilterValue) => void;
    isDisabled?: boolean;
};
