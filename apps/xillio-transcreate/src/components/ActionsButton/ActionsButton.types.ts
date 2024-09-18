import { ButtonProps, MenuProps } from "@contentful/f36-components";

export type ButtonAction<L extends string> = {
    onClick: () => void;
    label: L;
    variant: Exclude<ButtonProps["variant"], "transparent" | undefined>;
};

export type ActionsButtonProps<L extends string> = Pick<MenuProps, "placement" | "offset"> & {
    isDisabled?: boolean;
    isFullWidth?: boolean;
    actions: ButtonAction<L>[];
    onSelect?: (action: ButtonAction<L>) => void;
    onToggleOpen?: (isOpen: boolean) => void;
    delayOpen?: number;
};
