import { ButtonProps, Menu, ButtonGroup, Button, IconButton, MenuProps } from "@contentful/f36-components";
import { ChevronDownIcon } from "@contentful/f36-icons";
import { css, cx } from "emotion";
import { useState, useMemo, useEffect } from "react";

export type ButtonAction<L extends string> = {
    onClick: () => void;
    label: L;
    variant: ButtonProps["variant"];
};

export type ActionsButtonProps<L extends string> = Pick<MenuProps, "placement" | "offset"> & {
    isDisabled?: boolean;
    isFullWidth?: boolean;
    actions: ButtonAction<L>[];
    onSelect?: (action: ButtonAction<L>) => void;
    onToggle?: (isOpen: boolean) => void;
    delayOpen?: number;
};

const fullWidth = css({ maxWidth: "none", flexGrow: 1 });

export function ActionsButton<L extends string = string>({
    isDisabled = false,
    isFullWidth = false,
    actions,
    onSelect,
    onToggle,
    delayOpen,
    ...menuProps
}: ActionsButtonProps<L>) {
    const [actionIndex, setActionIndex] = useState(0);
    const action = useMemo(() => actions[actionIndex], [actionIndex, actions]);
    const [isOpen, _setIsOpen] = useState(false);

    const setIsOpen = (newIsOpen: boolean) => {
        if (onToggle) onToggle(newIsOpen);
        if (delayOpen && !isOpen) {
            setTimeout(() => _setIsOpen(newIsOpen), delayOpen);
        } else {
            _setIsOpen(newIsOpen);
        }
    };

    useEffect(() => {
        if (!onSelect) return;
        onSelect(action);
    }, [action["label"]]);

    return (
        <Menu isOpen={isOpen} onClose={() => setIsOpen(false)} {...menuProps}>
            <Menu.Trigger>
                <ButtonGroup>
                    <Button
                        variant={action.variant}
                        isDisabled={isDisabled}
                        className={cx({ [fullWidth]: isFullWidth })}
                        onClick={() => {
                            setIsOpen(false);
                            action.onClick();
                        }}
                    >
                        {action.label}
                    </Button>

                    <IconButton
                        variant={action.variant}
                        aria-label="Open dropdown"
                        icon={<ChevronDownIcon />}
                        onClick={() => setIsOpen(!isOpen)}
                    />
                </ButtonGroup>
            </Menu.Trigger>
            <Menu.List>
                <Menu.SectionTitle>Actions</Menu.SectionTitle>
                {actions.map((action, index) => (
                    <Menu.Item onClick={() => setActionIndex(index)} key={action.label}>
                        {action.label}
                    </Menu.Item>
                ))}
            </Menu.List>
        </Menu>
    );
}
