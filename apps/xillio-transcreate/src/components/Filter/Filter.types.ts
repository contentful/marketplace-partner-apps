import { ReactNode } from "react";

export type FilterConditions<ConditionValue extends string> = {
    options: ConditionValue[];
    selected: ConditionValue;
    onSelect: (condition: ConditionValue) => void;
};

export type FilterProps<ConditionValue extends string = string> = {
    name: string;
    value: string;
    Trigger?: ({ children }: { children: ReactNode }) => JSX.Element;
    onClick?: () => void;
    conditions?: FilterConditions<ConditionValue>;
    isDisabled?: boolean;
};
