import { Button, Checkbox, Flex, IconButton, Popover, Subheading } from "@contentful/f36-components";
import { MultiSelectFilterProps, MultiSelectFilterSearchBarProps } from "./MultiSelectFilter.types";
import { Filter } from "../Filter";
import { useEffect, useMemo, useRef, useState } from "react";
import { css } from "emotion";
import { Divider } from "../Divider";
import { CloseIcon, SearchIcon } from "@contentful/f36-icons";
import tokens from "@contentful/f36-tokens";

export const MultiSelectFilter = <MultiSelectFilterValue extends string>({
    name,
    options,
    selected: currentSelected,
    onSelect,
    isDisabled = false,
}: MultiSelectFilterProps<MultiSelectFilterValue>) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<Set<MultiSelectFilterValue>>(currentSelected);
    const [search, setSearch] = useState("");

    const value = useMemo(() => {
        if (!currentSelected.size) return "Any";
        const label = options[[...currentSelected][0]];
        if (currentSelected.size === 1) return label;
        return `${label} and ${currentSelected.size - 1} more`;
    }, [currentSelected]);

    const { selectedOptions, unselectedOptions } = useMemo(() => {
        const selectedOptions = { ...options };
        const unselectedOptions = { ...options };
        for (const id in options) {
            if (!options[id].toLowerCase().includes(search.toLowerCase())) {
                delete selectedOptions[id];
                delete unselectedOptions[id];
            } else if (currentSelected.has(id)) {
                delete unselectedOptions[id];
            } else {
                delete selectedOptions[id];
            }
        }
        return { selectedOptions, unselectedOptions };
    }, [options, currentSelected, search]);

    const hasSelectedOptions = Boolean(Object.keys(selectedOptions).length);
    const hasUnselectedOptions = Boolean(Object.keys(unselectedOptions).length);
    const hasChanges = useMemo(
        () =>
            ![...currentSelected].every((id) => selected.has(id)) ||
            ![...selected].every((id) => currentSelected.has(id)),
        [currentSelected, selected],
    );

    useEffect(() => {
        if (!isOpen) setSelected(currentSelected);
    }, [isOpen, currentSelected]);

    useEffect(() => {
        if (!isOpen) setSearch("");
    }, [isOpen]);

    const handleApply = () => {
        onSelect(selected);
        setIsOpen(false);
    };

    const handleReset = () => {
        onSelect(new Set());
        setIsOpen(false);
    };

    return (
        <Popover isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <Filter
                name={name}
                value={value}
                Trigger={Popover.Trigger}
                onClick={() => setIsOpen(!isOpen)}
                isDisabled={isDisabled}
            />
            <Popover.Content className={css({ overflow: "hidden" })}>
                <MultiSelectFilterSearchBar search={search} onSearch={setSearch} />
                <Divider />
                {hasSelectedOptions || hasUnselectedOptions ? (
                    <>
                        <div
                            className={css({
                                maxHeight: "min(40vh, 450px)",
                                overflowY: "auto",
                                overflowX: "hidden",
                                maxWidth: 250,
                            })}
                        >
                            {hasSelectedOptions && (
                                <MultiSelectFilterOptionList
                                    options={selectedOptions}
                                    selected={selected}
                                    onSelect={setSelected}
                                />
                            )}
                            {hasSelectedOptions && hasUnselectedOptions && <Divider />}
                            {hasUnselectedOptions && (
                                <MultiSelectFilterOptionList
                                    options={unselectedOptions}
                                    selected={selected}
                                    onSelect={setSelected}
                                />
                            )}
                        </div>
                        <Divider />
                        <Flex padding="spacingXs" gap="spacingXs">
                            <Button
                                variant="primary"
                                className={css({ flexGrow: 1 })}
                                isDisabled={!hasChanges}
                                onClick={handleApply}
                            >
                                Apply
                            </Button>
                            <Button
                                variant="transparent"
                                className={css({ flexGrow: 1 })}
                                isDisabled={!currentSelected.size}
                                onClick={handleReset}
                            >
                                Reset to Any
                            </Button>
                        </Flex>
                    </>
                ) : (
                    <MultiSelectFilterNoMatch />
                )}
            </Popover.Content>
        </Popover>
    );
};

export const MultiSelectFilterSearchBar = ({ search, onSearch }: MultiSelectFilterSearchBarProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    return (
        <Flex>
            <input
                ref={inputRef}
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search..."
                className={css({
                    outline: "none",
                    border: "none",
                    padding: tokens.spacingXs,
                    paddingRight: 0,
                    flexGrow: 1,
                })}
            />
            <IconButton
                className={css({ margin: tokens.spacing2Xs })}
                size="small"
                variant="transparent"
                aria-label="Search"
                icon={search ? <CloseIcon /> : <SearchIcon />}
                onClick={() => {
                    if (search) {
                        onSearch("");
                    } else {
                        inputRef.current?.focus();
                    }
                }}
            />
        </Flex>
    );
};

export const MultiSelectFilterOptionList = <MultiSelectFilterValue extends string>({
    options,
    selected,
    onSelect,
}: Omit<MultiSelectFilterProps<MultiSelectFilterValue>, "name">) => {
    const handleSelect = (id: MultiSelectFilterValue) => {
        if (selected.has(id)) {
            const newSet = new Set(selected);
            newSet.delete(id);
            onSelect(newSet);
        } else {
            onSelect(new Set(selected).add(id));
        }
    };

    return (
        <Flex padding="spacingXs" gap="spacingXs" flexDirection="column">
            {Object.keys(options).map((id) => (
                <Checkbox
                    key={id}
                    isChecked={selected.has(id as MultiSelectFilterValue)}
                    onChange={() => handleSelect(id as MultiSelectFilterValue)}
                >
                    {options[id as MultiSelectFilterValue]}
                </Checkbox>
            ))}
        </Flex>
    );
};

export const MultiSelectFilterNoMatch = () => (
    <Subheading
        className={css({
            margin: tokens.spacingM,
            textAlign: "center",
            color: tokens.gray600,
        })}
    >
        No matches found
    </Subheading>
);
