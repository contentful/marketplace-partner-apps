import { ButtonGroup, Button, Menu, Caption, Flex, Text } from "@contentful/f36-components";
import { ChevronDownIcon } from "@contentful/f36-icons";
import tokens from "@contentful/f36-tokens";
import { FilterConditions, FilterProps } from "./Filter.types";
import { ReactNode } from "react";
import { css, cx } from "emotion";

const EmptyTrigger = ({ children }: { children: ReactNode }) => <>{children}</>;

export function Filter<ConditionValue extends string = string>({
    name,
    value,
    Trigger = EmptyTrigger,
    onClick,
    conditions,
    isDisabled = false,
}: FilterProps<ConditionValue>) {
    return (
        <ButtonGroup className={css({ position: "relative" })}>
            <Button
                isDisabled={isDisabled}
                size="small"
                style={{
                    boxShadow: "none",
                    fontWeight: 600,
                    color: tokens.gray700,
                    borderColor: tokens.gray300,
                    backgroundColor: tokens.gray200,
                    zIndex: "auto",
                }}
                className={cx({
                    [css({ cursor: "default" })]: !isDisabled,
                    [css({ cursor: "not-allowed" })]: isDisabled,
                })}
            >
                {name}
            </Button>

            {conditions && <ConditionSelect {...conditions} />}
            <Trigger>
                <Button
                    isDisabled={isDisabled}
                    size="small"
                    style={{
                        boxShadow: "none",
                        color: tokens.colorWhite,
                        backgroundColor: tokens.colorPrimary,
                        borderColor: tokens.colorPrimary,
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                    }}
                    endIcon={<ChevronDownIcon />}
                    onClick={onClick}
                >
                    {value}
                </Button>
            </Trigger>
        </ButtonGroup>
    );
}

function ConditionSelect<ConditionValue extends string>({
    options,
    selected,
    onSelect,
}: FilterConditions<ConditionValue>) {
    return (
        <Menu>
            <Menu.Trigger>
                <Flex alignItems="center" className={css({ position: "relative" })}>
                    <div
                        className={css({
                            backgroundColor: tokens.gray200,
                            position: "absolute",
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: "50%",
                            borderTop: `1px solid ${tokens.gray300}`,
                            borderBottom: `1px solid ${tokens.gray300}`,
                        })}
                    />
                    <Text
                        fontSize="fontSizeS"
                        lineHeight="lineHeightS"
                        fontWeight="fontWeightMedium"
                        className={css({
                            backgroundColor: tokens.colorWhite,
                            cursor: "pointer",
                            position: "relative",
                            zIndex: 10,
                            padding: "3px 10px",
                            borderRadius: 11,
                            color: tokens.colorPrimary,
                        })}
                    >
                        {selected}
                    </Text>
                    <div
                        className={css({
                            backgroundColor: tokens.colorPrimary,
                            position: "absolute",
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: "50%",
                        })}
                    />
                </Flex>
            </Menu.Trigger>
            <Menu.List>
                {options.map((condition) => (
                    <Menu.Item key={condition} onClick={() => onSelect(condition)}>
                        {condition}
                    </Menu.Item>
                ))}
            </Menu.List>
        </Menu>
    );
}
