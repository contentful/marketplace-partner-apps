import { Button, Flex, Menu } from "@contentful/f36-components";
import { SearchBarProps } from "./SearchBar.types";
import { css, cx } from '@emotion/css';
import tokens from "@contentful/f36-tokens";
import { MouseEvent, useRef, useState } from "react";
import { FilterIcon } from "@contentful/f36-icons";

const focusClass = css({
    boxShadow: tokens.glowPrimary,
    borderColor: tokens.colorPrimary,
});

const notAllowedClass = css({
    cursor: "not-allowed",
});

export const SearchBar = ({
    filters,
    filterMenuItems,
    search,
    onSearch,
    isDisabled = false,
}: SearchBarProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [inputHasFocus, setInputHasFocus] = useState(false);

    const handleFocus = () => {
        inputRef.current?.focus();
    };

    return (
        <Flex
            justifyContent="space-between"
            className={cx(
                css({
                    padding: 3,
                    borderRadius: 10,
                    backgroundColor: tokens.colorWhite,
                    border: `1px solid ${tokens.gray300}`,
                    boxShadow: tokens.insetBoxShadowDefault,
                    color: tokens.gray700,
                    cursor: "text",
                }),
                {
                    [focusClass]: inputHasFocus,
                    [notAllowedClass]: isDisabled,
                },
            )}
            onClick={handleFocus}
        >
            <Flex gap="3px" flexWrap="wrap">
                {filters.map((filter, index) => (
                    <div onClick={(e) => e.stopPropagation()} key={index}>
                        {filter}
                    </div>
                ))}
                <input
                    disabled={isDisabled}
                    ref={inputRef}
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Type to search for entries"
                    className={cx(
                        css({
                            backgroundColor: tokens.colorWhite,
                            outline: "none",
                            border: "none",
                            padding: 6,
                            flexGrow: 1,
                            minWidth: 300,
                        }),
                        {
                            [notAllowedClass]: isDisabled,
                        },
                    )}
                    onFocus={() => setInputHasFocus(true)}
                    onBlur={() => setInputHasFocus(false)}
                />
            </Flex>

            <Menu>
                <Menu.Trigger>
                    <Button
                        isDisabled={isDisabled}
                        variant="transparent"
                        size="small"
                        startIcon={<FilterIcon className={css({ fill: tokens.colorPrimary })} />}
                        className={css({
                            color: tokens.colorPrimary,
                        })}
                        onClick={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                    >
                        Filter
                    </Button>
                </Menu.Trigger>
                <Menu.List>
                    <Menu.SectionTitle>Filters</Menu.SectionTitle>
                    {...filterMenuItems}
                </Menu.List>
            </Menu>
        </Flex>
    );
};
