export type CalendarFilterCondition =
    | "is"
    | "is greater than"
    | "is greater than or equal to"
    | "is less than"
    | "is less than or equal to";

export type CalendarFilterProps = {
    name: string;
    date: Date | null;
    onDate: (selected: Date | null) => void;
    condition: CalendarFilterCondition;
    onCondition: (condition: CalendarFilterCondition) => void;
    isDisabled?: boolean;
};
